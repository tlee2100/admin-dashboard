"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { useAgentChatStore } from "@/store/agent-chat-store";
import { ChatWidget } from "@/components/chat/chat-widget";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

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
  const [isAiActive, setIsAiActive] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [hasMore, setHasMore] = useState(true);
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
    replaceMessageId,
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
    let socketInstance: Socket | null = null;
    let isMounted = true;

    const init = async () => {
      if (!session?.accessToken) return;

      let userJoined = false;
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
          if (!isMounted) return;
          setIsClosed(info.status === "CLOSED");
          setIsPaused(info.status === "PAUSED");
          setIsAiActive(info.isAiActive !== false); // default to true

          const currentAgentId = info.agentId
            ? String(info.agentId)
            : info.agent?.id
              ? String(info.agent.id)
              : null;
          const userId = session?.user?.id ? String(session.user.id) : null;
          userJoined = !!(
            currentAgentId &&
            userId &&
            currentAgentId === userId
          );
          setIsJoined(userJoined);
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
          if (!isMounted) return;
          setMessages(conversationId, data);
          if (data.length < PAGE_LIMIT) setHasMore(false);
        } else {
          console.error("Failed to load chat data", res.status);
        }
      } catch (err) {
        console.error(err);
      }

      if (!isMounted) return;

      // Setup Socket
      socketInstance = io(
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

        if (userJoined) {
          socketInstance?.emit("joinConversation", { conversationId });
        } else {
          socketInstance?.emit("subscribeConversation", { conversationId });
        }

        // Mark unread messages as READ if window is focused
        if (document.hasFocus()) {
          messagesRef.current.forEach((m) => {
            if (m.senderType === "VISITOR" && m.status !== "READ") {
              socketInstance?.emit("markAsRead", {
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
          senderType: "VISITOR" | "AGENT" | "AI";
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
              socketInstance?.emit("markAsRead", {
                conversationId,
                messageId: payload.id,
              });
            }
          }
        },
      );

      socketInstance.on("joinError", (error) => {
        toast.error(error.message || "Unable to join conversation.");
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
        "aiToggled",
        (payload: { conversationId: string; isAiActive: boolean }) => {
          if (payload.conversationId === conversationId) {
            setIsAiActive(payload.isAiActive);
          }
        },
      );

      socketInstance.on(
        "messageReactionUpdated",
        (payload: {
          messageId: string;
          reactions: Record<string, string[]>;
        }) => {
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
        socketInstance?.emit("announcePresence", {
          conversationId,
          senderType: "AGENT",
        });
      });

      socketInstance.on(
        "messageStatus",
        (payload: { messageId: string; status: string }) => {
          updateMessageStatus(
            conversationId,
            payload.messageId,
            payload.status,
          );
        },
      );

      socketInstance.on(
        "messageSaved",
        (payload: {
          localId?: string;
          id: string;
          status?: string;
          fileUrl?: string;
          fileName?: string;
          fileType?: string;
          reactions?: Record<string, string[]>;
        }) => {
          if (payload.localId) {
            replaceMessageId(
              conversationId,
              payload.localId,
              payload.id,
              payload.status,
            );
          }
        },
      );
    };

    init();

    const handleFocus = () => {
      if (!socketInstance?.connected) return;
      messagesRef.current.forEach((m) => {
        if (m.senderType === "VISITOR" && m.status !== "READ") {
          socketInstance?.emit("markAsRead", {
            conversationId,
            messageId: m.id,
          });
        }
      });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleFocus);
      socketInstance?.disconnect();
    };
  }, [
    session?.accessToken,
    conversationId,
    session?.user?.id,
    addMessage,
    setTyping,
    setOtherPartyOnline,
    updateMessageStatus,
    updateMessageReactions,
    replaceMessageId,
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
            localId: parsed.localId,
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
    const localId = uuidv4();

    // Add to local state immediately for instant feedback
    addMessage(conversationId, {
      id: localId,
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
        JSON.stringify({ content: text, fileUrl, fileName, fileType, localId }),
      );
      return;
    }

    // Automatically deactivate AI when human agent sends a message
    if (isAiActive) {
      handleToggleAi(false);
    }

    // Emit to server
    socket.emit("sendMessage", {
      conversationId,
      message: text,
      fileUrl,
      fileName,
      fileType,
      senderType: "AGENT",
      localId,
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
        if (data.length < PAGE_LIMIT) setHasMore(false);
      }
    } catch (e) {
      console.error("Failed to load more history", e);
    }
  };

  const handleTyping = (typing: boolean) => {
    if (!socket || !isConnected) return;
    socket.emit("typing", { conversationId, isTyping: typing });
  };

  const handleToggleAi = (active: boolean) => {
    if (!socket || !isConnected) return;
    socket.emit("toggleAi", { conversationId, isAiActive: active });
    setIsAiActive(active);
  };

  const handleEndChat = async () => {
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
        toast.success("Conversation closed successfully");
      } else {
        toast.error("Failed to end chat");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error ending chat");
    }
  };

  const handleCloseWindow = () => {
    router.push("/dashboard/chats");
  };

  const handleJoinChat = () => {
    if (!socket || !isConnected) return;
    socket.emit("joinConversation", { conversationId });
    setIsJoined(true);
    // When agent joins, automatically disable AI so human takes over
    if (isAiActive) {
      handleToggleAi(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-4">
      <ChatWidget
        conversationId={conversationId}
        messages={messages}
        isConnected={isConnected}
        isTyping={isTyping}
        isClosed={isClosed}
        isPaused={isPaused}
        isAiActive={isAiActive}
        isJoined={isJoined}
        otherPartyOnline={otherPartyOnline}
        currentUserType="AGENT"
        onSendMessage={handleSendMessage}
        onReactMessage={handleReactMessage}
        onPauseChat={handlePauseChat}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        onTyping={handleTyping}
        onToggleAi={handleToggleAi}
        onEndChat={handleEndChat}
        onCloseChat={handleCloseWindow}
        onJoinChat={handleJoinChat}
      />
    </div>
  );
}
