"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useVisitorChatStore } from "@/types/visitor-chat-store"; // adjust if moved to /store
import { ChatWidget } from "@/components/chat/chat-widget";
import { v4 as uuidv4 } from "uuid";

export default function VisitorChatRoom() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [socket, setSocket] = useState<Socket | null>(null);

  // Pull data from our Zustand Store
  const {
    currentConversation,
    messages,
    isConnected,
    isTyping,
    pendingMessages,
    otherPartyOnline,
    addMessage,
    setConnectionStatus,
    setConversationStatus,
    updateConversation,
    setTyping,
    updateMessageStatus,
    updateMessageReactions,
    replaceMessageId,
    addPendingMessage,
    clearPendingMessages,
    setOtherPartyOnline,
    clearChat,
    streamingMessages,
    setStreamingMessages,
  } = useVisitorChatStore();

  const isClosed = currentConversation?.status === "CLOSED";
  const isPaused = currentConversation?.status === "PAUSED";
  const [mounted, setMounted] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 1. Handle Hydration
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 2. Validation: check if conversation exists in local storage
  useEffect(() => {
    if (!mounted) return;
    if (!currentConversation || currentConversation.id !== conversationId) {
      router.push(`/test-chat/${params.siteId}`);
    }
  }, [mounted, currentConversation, conversationId, params.siteId, router]);

  const hasFetchedHistory = useRef(false);

  // Fetch initial messages like agent dashboard
  useEffect(() => {
    if (
      !mounted ||
      !currentConversation ||
      currentConversation.id !== conversationId ||
      hasFetchedHistory.current
    )
      return;

    hasFetchedHistory.current = true;

    const fetchHistory = async () => {
      try {
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

        // Fetch fresh conversation metadata (isAiActive, status) from DB so we don't rely on stale Zustand persisted state
        const metaRes = await fetch(
          `${apiBase}/chat/conversations/${conversationId}/meta`,
        );
        if (metaRes.ok) {
          const meta = await metaRes.json();
          if (meta) {
            updateConversation({
              isAiActive: meta.isAiActive,
              status: meta.status,
              handlingStatus: meta.handlingStatus,
            });
          }
        }

        const res = await fetch(
          `${apiBase}/chat/conversations/${conversationId}/messages?limit=10`,
        );
        if (res.ok) {
          const data = await res.json();
          useVisitorChatStore.getState().setMessages(data);
          if (data.length < 10) setHasMore(false);
        }
      } catch (err) {
        console.error("Failed to fetch initial messages:", err);
      }
    };

    fetchHistory();
  }, [mounted, currentConversation, conversationId, updateConversation]);

  // 3. Main WebSocket Logic
  useEffect(() => {
    if (!mounted) return;
    if (!currentConversation || currentConversation.id !== conversationId)
      return;

    // Initialize WebSocket Connection
    const socketInstance = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
      {
        query: { conversationId },
      },
    );

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setConnectionStatus(true);

      // Request presence from other party by emitting our own presence
      // (The backend sends this when visitor joins, but we can also trigger markAsRead)
      if (document.hasFocus()) {
        messagesRef.current.forEach((m) => {
          if (m.senderType === "AGENT" && m.status !== "READ") {
            socketInstance.emit("markAsRead", {
              conversationId,
              messageId: m.id,
            });
          }
        });
      }
    });

    socketInstance.on("disconnect", () => {
      setConnectionStatus(false);
      setOtherPartyOnline(false);
    });

    socketInstance.on(
      "newMessage",
      (payload: {
        id?: string;
        conversationId: string;
        message: string;
        senderType: "VISITOR" | "AGENT";
        createdAt?: string;
        fileUrl?: string;
        fileName?: string;
        fileType?: string;
        reactions?: Record<string, string[]>;
      }) => {
        if (payload.conversationId === conversationId) {
          addMessage({
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
            payload.senderType === "AGENT" &&
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

    socketInstance.on(
      "typing",
      (payload: { conversationId: string; isTyping: boolean }) => {
        if (payload.conversationId === conversationId) {
          setTyping(payload.isTyping);
        }
      },
    );

    socketInstance.on("conversationClosed", (payload: { id: string }) => {
      if (payload.id === conversationId) {
        setConversationStatus("CLOSED");
        setTyping(false);
      }
    });

    socketInstance.on("conversationPaused", (payload: { id: string }) => {
      if (payload.id === conversationId) {
        setConversationStatus("PAUSED");
      }
    });

    socketInstance.on("conversationResumed", (payload: { id: string }) => {
      if (payload.id === conversationId) {
        setConversationStatus("OPEN");
      }
    });

    socketInstance.on(
      "aiToggled",
      (payload: { conversationId: string; isAiActive: boolean }) => {
        if (payload.conversationId === conversationId) {
          updateConversation({ isAiActive: payload.isAiActive });
        }
      },
    );

    socketInstance.on(
      "agentJoined",
      (payload: {
        conversationId: string;
        handlingStatus: "AGENT_HANDLING";
      }) => {
        if (payload.conversationId === conversationId) {
          updateConversation({ handlingStatus: payload.handlingStatus });
        }
      },
    );

    socketInstance.on(
      "handlingStatusUpdated",
      (payload: {
        conversationId: string;
        handlingStatus: "WAITING_FOR_AGENT";
      }) => {
        if (payload.conversationId === conversationId) {
          updateConversation({ handlingStatus: payload.handlingStatus });
        }
      },
    );

    socketInstance.on(
      "messageReactionUpdated",
      (payload: { messageId: string; reactions: Record<string, string[]> }) => {
        updateMessageReactions(payload.messageId, payload.reactions);
      },
    );

    socketInstance.on(
      "participantPresence",
      (payload: { online: boolean; senderType?: string }) => {
        // If we are a visitor, we care if the agent is online
        if (payload.senderType === "AGENT" || payload.online === false) {
          setOtherPartyOnline(payload.online);
        }
      },
    );

    socketInstance.on("presenceRequested", () => {
      socketInstance.emit("announcePresence", {
        conversationId,
        senderType: "VISITOR",
      });
    });

    socketInstance.on(
      "messageStatus",
      (payload: { messageId: string; status: string }) => {
        updateMessageStatus(payload.messageId, payload.status);
      },
    );

    // When the server confirms our message was saved, swap the fake localId with the real DB id
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
          replaceMessageId(payload.localId, payload.id, payload.status);
        }
      },
    );

    const handleFocus = () => {
      if (!socketInstance.connected) return;
      messagesRef.current.forEach((m) => {
        if (m.senderType === "AGENT" && m.status !== "READ") {
          socketInstance.emit("markAsRead", {
            conversationId,
            messageId: m.id,
          });
        }
      });
    };

    window.addEventListener("focus", handleFocus);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("focus", handleFocus);
      socketInstance.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mounted,
    conversationId,
    router,
    params.siteId,
    setConnectionStatus,
    addMessage,
    setTyping,
    setConversationStatus,
    setOtherPartyOnline,
    updateMessageStatus,
    updateMessageReactions,
    replaceMessageId,
  ]);

  // Process offline queue on reconnect
  useEffect(() => {
    if (isConnected && socket && pendingMessages.length > 0) {
      pendingMessages.forEach((text) => {
        try {
          const parsed = JSON.parse(text);
          socket.emit("sendMessage", {
            conversationId,
            message: parsed.content || "",
            fileUrl: parsed.fileUrl,
            fileName: parsed.fileName,
            fileType: parsed.fileType,
            senderType: "VISITOR",
          });
        } catch {
          socket.emit("sendMessage", {
            conversationId,
            message: text,
            senderType: "VISITOR",
          });
        }
      });
      clearPendingMessages();
    }
  }, [
    isConnected,
    socket,
    pendingMessages,
    conversationId,
    clearPendingMessages,
  ]);

  // 3. Handle sending a message FROM the widget TO the server
  const handleSendMessage = (
    text: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string,
  ) => {
    // Immediately add it to our local state so the UI feels instant
    const localId = uuidv4();
    const newLocalMessage = {
      id: localId,
      conversationId,
      content: text,
      fileUrl,
      fileName,
      fileType,
      senderType: "VISITOR" as const,
      createdAt: new Date().toISOString(),
      status: "SENT",
    };
    addMessage(newLocalMessage);

    if (!socket || !isConnected) {
      addPendingMessage(
        JSON.stringify({ content: text, fileUrl, fileName, fileType }),
      );
      return;
    }

    // Emit the event to the server — include localId so we can reconcile when server responds
    socket.emit("sendMessage", {
      conversationId,
      message: text,
      fileUrl,
      fileName,
      fileType,
      senderType: "VISITOR",
      localId,
    });
  };

  const handleReactMessage = (messageId: string, emoji: string) => {
    if (!socket || !isConnected) return;
    socket.emit("reactMessage", {
      conversationId,
      messageId,
      emoji,
      userId: "visitor",
    });
  };

  const handlePauseChat = () => {
    if (!socket || !isConnected) return;
    if (isPaused) {
      socket.emit("sendMessage", {
        conversationId,
        message: "Chat resumed",
        senderType: "VISITOR",
        localId: uuidv4(),
      });
    } else {
      socket.emit("pauseConversation", { conversationId });
    }
  };

  const handleTyping = (typing: boolean) => {
    if (!socket || !isConnected) return;
    socket.emit("typing", { conversationId, isTyping: typing });
  };

  const handleLoadMore = async () => {
    if (!hasMore || messages.length === 0) return;

    // Find the oldest message currently in React state
    const oldestMessage = messages[0];

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/chat/conversations/${conversationId}/messages?cursor=${oldestMessage.createdAt}&limit=10`,
      );
      if (!res.ok) throw new Error("Failed to fetch messages");

      const data = await res.json();

      // If we got fewer than limit, there are no more older messages
      if (data.length < 10) {
        setHasMore(false);
      }

      if (data.length > 0) {
        // The API returns messages ordered chronologically if we reversed it in backend?
        // Wait, the backend already does .reverse(). But earlier we assumed it didn't.
        // Let's just pass data since the backend returns chronological.
        // Actually, backend returns them in chronological order. We want to prepend them in chronological order.
        useVisitorChatStore.getState().prependMessages(data);
      }
    } catch (err) {
      console.error("Failed to load more messages:", err);
    }
  };

  const handleEndChat = () => {
    if (confirm("Are you sure you want to end this chat?")) {
      if (socket && isConnected) {
        socket.emit("endConversation", { conversationId });
        socket.disconnect();
      }
      clearChat();
      router.push(`/test-chat/${params.siteId}`);
    }
  };

  const handleCallAgent = () => {
    if (!socket || !isConnected) return;
    socket.emit("callAgent", { conversationId });
    alert("An agent has been notified and will join shortly.");
  };

  return (
    <div className="h-screen w-screen bg-slate-100 flex items-center justify-center p-4">
      {/* Container to restrict the widget's max width/height to look like a desktop floating widget, 
          but fills the screen on mobile */}
      <div className="w-full max-w-md h-full max-h-[700px] sm:h-[80vh] flex flex-col bg-slate-50 dark:bg-slate-900 border rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-slate-950 px-5 py-4 border-b flex justify-between items-center shadow-sm z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Chat Support
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {currentConversation?.handlingStatus === "WAITING_FOR_AGENT"
                ? "Waiting for Agent..."
                : currentConversation?.handlingStatus === "AGENT_HANDLING"
                  ? "Agent is here"
                  : "We usually reply in a few minutes"}
            </p>
          </div>
          <button
            onClick={handleCallAgent}
            disabled={!isConnected}
            className="text-sm font-medium px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors disabled:opacity-50"
          >
            Call Agent
          </button>
        </div>
        <div className="flex-1 min-h-0 relative">
          <ChatWidget
            conversationId={conversationId}
            messages={messages}
            currentUserType="VISITOR"
            isConnected={isConnected}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            otherPartyOnline={otherPartyOnline}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            isClosed={isClosed}
            isAiActive={currentConversation?.isAiActive ?? true}
            isWaitingForAgent={
              currentConversation?.handlingStatus === "WAITING_FOR_AGENT"
            }
            onEndChat={handleEndChat}
            onPauseChat={handlePauseChat}
            isPaused={isPaused}
            onReactMessage={handleReactMessage}
            initialStreamingMessages={streamingMessages}
            onStreamingMessagesChange={setStreamingMessages}
          />
        </div>
      </div>
    </div>
  );
}
