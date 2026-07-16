"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { useAgentChatStore } from "@/types/agent-chat-store";
import { ChatWidget } from "@/components/chat/chat-widget";
import { v4 as uuidv4 } from "uuid";

const PAGE_LIMIT = process.env.NEXT_PUBLIC_CHAT_PAGE_SIZE
  ? parseInt(process.env.NEXT_PUBLIC_CHAT_PAGE_SIZE as string, 10)
  : 10;

export default function AgentChatRoom() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const {
    messagesByConversation,
    typingStatuses,
    pendingMessages: allPendingMessages,
    otherPartyOnline: allOtherPartyOnline,
    addMessage,
    setMessages,
    prependMessages,
    setTyping,
    addPendingMessage,
    clearPendingMessages,
    setOtherPartyOnline,
    updateMessageStatus,
    updateMessageReactions,
  } = useAgentChatStore();
  const messages = useMemo(
    () => messagesByConversation[conversationId] || [],
    [messagesByConversation, conversationId],
  );
  const isTyping = typingStatuses[conversationId] || false;
  const pendingQueue = useMemo(
    () => allPendingMessages[conversationId] || [],
    [allPendingMessages, conversationId],
  );
  const otherPartyOnline = allOtherPartyOnline[conversationId] || false;

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Fetch conversation history and status
  useEffect(() => {
    const fetchHistoryAndStatus = async () => {
      if (!session?.accessToken) return;
      try {
        // Fetch status
        const infoRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          },
        );
        if (infoRes.ok) {
          const info = await infoRes.json();
          setIsClosed(info.status === "CLOSED");
          setIsPaused(info.status === "PAUSED");
        }

        // Fetch messages
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}/messages?limit=${PAGE_LIMIT}`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          },
        );

        if (res.ok) {
          const data = await res.json();
          setMessages(conversationId, data);
        } else {
          console.error("Failed to load chat data", res.status);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchHistoryAndStatus();

    // Setup Socket
    const socketInstance = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
      {
        query: {
          conversationId,
        },
        auth: {
          token: session?.accessToken,
        },
      },
    );

    socketInstance.on("connect", () => {
      setSocket(socketInstance);
      setIsConnected(true);

      // Request presence from other party by emitting our own presence
      socketInstance.emit("joinConversation", { conversationId });

      // Mark unread messages as READ if window is focused
      if (document.hasFocus()) {
        messagesRef.current.forEach((m) => {
          if (m.senderType === "VISITOR" && m.status !== "READ") {
            socketInstance.emit("markAsRead", {
              conversationId,
              messageId: m.id,
            });
          }
        });
      }
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      setOtherPartyOnline(conversationId, false);
    });

    socketInstance.on(
      "newMessage",
      (payload: {
        id: string;
        conversationId: string;
        message: string;
        senderType: "VISITOR" | "AGENT";
        createdAt: string;
        fileUrl?: string;
        fileName?: string;
        fileType?: string;
        reactions?: Record<string, string[]>;
      }) => {
        if (payload.conversationId === conversationId) {
          addMessage(conversationId, {
            id: payload.id || uuidv4(),
            conversationId: payload.conversationId,
            content: payload.message,
            senderType: payload.senderType,
            createdAt: payload.createdAt || new Date().toISOString(),
            fileUrl: payload.fileUrl,
            fileName: payload.fileName,
            fileType: payload.fileType,
            reactions: payload.reactions,
          });

          // Automatically mark the incoming message as read if the window is focused
          if (
            document.hasFocus() &&
            payload.senderType === "VISITOR" &&
            payload.id
          ) {
            socketInstance.emit("markAsRead", {
              conversationId,
              messageId: payload.id,
            });
          }
        }
      },
    );

    socketInstance.on("joinError", (error) => {
      alert(error.message || "Unable to join conversation.");
      router.push("/dashboard/chats");
    });

    socketInstance.on(
      "typing",
      (payload: { conversationId: string; isTyping: boolean }) => {
        if (payload.conversationId === conversationId) {
          setTyping(conversationId, payload.isTyping);
        }
      },
    );

    socketInstance.on("conversationClosed", (payload: { id: string }) => {
      if (payload.id === conversationId) {
        setIsClosed(true);
      }
    });

    socketInstance.on("conversationPaused", (payload: { id: string }) => {
      if (payload.id === conversationId) {
        setIsPaused(true);
      }
    });

    socketInstance.on("conversationResumed", (payload: { id: string }) => {
      if (payload.id === conversationId) {
        setIsPaused(false);
      }
    });

    socketInstance.on(
      "messageReactionUpdated",
      (payload: { messageId: string; reactions: Record<string, string[]> }) => {
        updateMessageReactions(
          conversationId,
          payload.messageId,
          payload.reactions,
        );
      },
    );

    socketInstance.on(
      "participantPresence",
      (payload: { online: boolean; senderType?: string }) => {
        // If we are an agent, we care if the visitor is online or another agent
        if (payload.senderType === "VISITOR" || payload.online === false) {
          setOtherPartyOnline(conversationId, payload.online);
        }
      },
    );

    socketInstance.on("presenceRequested", () => {
      socketInstance.emit("announcePresence", {
        conversationId,
        senderType: "AGENT",
      });
    });

    socketInstance.on(
      "messageStatus",
      (payload: { messageId: string; status: string }) => {
        updateMessageStatus(conversationId, payload.messageId, payload.status);
      },
    );

    const handleFocus = () => {
      if (!socketInstance.connected) return;
      messagesRef.current.forEach((m) => {
        if (m.senderType === "VISITOR" && m.status !== "READ") {
          socketInstance.emit("markAsRead", {
            conversationId,
            messageId: m.id,
          });
        }
      });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      socketInstance.disconnect();
    };
  }, [
    session?.accessToken,
    conversationId,
    addMessage,
    setTyping,
    setOtherPartyOnline,
    updateMessageStatus,
    updateMessageReactions,
    router,
    setMessages,
  ]);

  // Process offline queue on reconnect
  useEffect(() => {
    if (isConnected && socket && pendingQueue.length > 0) {
      pendingQueue.forEach((text) => {
        try {
          const parsed = JSON.parse(text);
          socket.emit("sendMessage", {
            conversationId,
            message: parsed.content || "",
            fileUrl: parsed.fileUrl,
            fileName: parsed.fileName,
            fileType: parsed.fileType,
            senderType: "AGENT",
          });
        } catch {
          socket.emit("sendMessage", {
            conversationId,
            message: text,
            senderType: "AGENT",
          });
        }
      });
      clearPendingMessages(conversationId);
    }
  }, [isConnected, socket, pendingQueue, conversationId, clearPendingMessages]);

  const handleSendMessage = (
    text: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string,
  ) => {
    // Add to local state immediately for instant feedback
    addMessage(conversationId, {
      id: uuidv4(),
      conversationId,
      content: text,
      fileUrl,
      fileName,
      fileType,
      senderType: "AGENT",
      createdAt: new Date().toISOString(),
      status: "SENT",
    });

    if (!socket || !isConnected) {
      addPendingMessage(
        conversationId,
        JSON.stringify({ content: text, fileUrl, fileName, fileType }),
      );
      return;
    }

    // Emit to server
    socket.emit("sendMessage", {
      conversationId,
      message: text,
      fileUrl,
      fileName,
      fileType,
      senderType: "AGENT",
    });
  };

  const handleReactMessage = (messageId: string, emoji: string) => {
    if (!socket || !isConnected) return;
    socket.emit("reactMessage", {
      conversationId,
      messageId,
      emoji,
      userId: session?.user?.id || "agent",
    });
  };

  const handlePauseChat = () => {
    if (!socket || !isConnected) return;
    if (isPaused) {
      socket.emit("sendMessage", {
        conversationId,
        message: "Chat resumed by agent",
        senderType: "AGENT",
        localId: uuidv4(),
      });
    } else {
      socket.emit("pauseConversation", { conversationId });
    }
  };

  const handleLoadMore = async () => {
    if (!session?.accessToken || messages.length === 0) return;
    try {
      const oldestMessage = messages[0];
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}/messages?cursor=${oldestMessage.createdAt}&limit=${PAGE_LIMIT}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          prependMessages(conversationId, data);
        }
      }
    } catch (e) {
      console.error("Failed to load more history", e);
    }
  };

  const handleTyping = (typing: boolean) => {
    if (!socket || !isConnected) return;
    socket.emit("typing", { conversationId, isTyping: typing });
  };

  const handleEndChat = async () => {
    if (!window.confirm("Are you sure you want to end this conversation?")) {
      return;
    }

    if (!session?.accessToken) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}/close`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );
      if (res.ok) {
        setIsClosed(true);
      } else {
        alert("Failed to end chat");
      }
    } catch (error) {
      console.error(error);
      alert("Error ending chat");
    }
  };

  const handleCloseWindow = () => {
    router.push("/dashboard/chats");
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-4">
      <ChatWidget
        messages={messages}
        isConnected={isConnected}
        isTyping={isTyping}
        isClosed={isClosed}
        isPaused={isPaused}
        otherPartyOnline={otherPartyOnline}
        currentUserType="AGENT"
        onSendMessage={handleSendMessage}
        onReactMessage={handleReactMessage}
        onPauseChat={handlePauseChat}
        onLoadMore={handleLoadMore}
        onTyping={handleTyping}
        onEndChat={handleEndChat}
        onCloseChat={handleCloseWindow}
      />
    </div>
  );
}
