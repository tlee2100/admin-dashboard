"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { useAgentChatStore } from "@/types/agent-chat-store";
import { ChatWidget } from "@/components/chat/chat-widget";
import { v4 as uuidv4 } from "uuid";

export default function AgentChatRoom() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const {
    messagesByConversation,
    typingStatuses,
    addMessage,
    setMessages,
    setTyping,
  } = useAgentChatStore();
  const messages = messagesByConversation[conversationId] || [];
  const isTyping = typingStatuses[conversationId] || false;

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
        }

        // Fetch messages
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(conversationId, data);
        }
      } catch (error) {
        console.error("Failed to fetch conversation data", error);
      }
    };

    fetchHistoryAndStatus();
  }, [conversationId, session?.accessToken, setMessages]);

  useEffect(() => {
    if (!session?.accessToken) return;

    // Agent connects with their JWT token
    const socketInstance = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
      {
        auth: { token: session.accessToken },
      },
    );

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setIsConnected(true);
      // Join the specific conversation room on the server
      socketInstance.emit("joinConversation", { conversationId });
    });

    socketInstance.on("disconnect", () => setIsConnected(false));

    socketInstance.on(
      "newMessage",
      (payload: {
        conversationId: string;
        message: string;
        senderType: "VISITOR" | "AGENT";
      }) => {
        if (payload.conversationId === conversationId) {
          addMessage(conversationId, {
            id: uuidv4(),
            conversationId: payload.conversationId,
            content: payload.message,
            senderType: payload.senderType,
            createdAt: new Date().toISOString(),
          });
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

    return () => {
      socketInstance.disconnect();
    };
  }, [session?.accessToken, conversationId, addMessage, setTyping, router]);

  const handleSendMessage = (text: string) => {
    if (!socket || !isConnected) return;

    // Add to local state immediately for instant feedback
    addMessage(conversationId, {
      id: uuidv4(),
      conversationId,
      content: text,
      senderType: "AGENT",
      createdAt: new Date().toISOString(),
    });

    // Emit to server
    socket.emit("sendMessage", {
      conversationId,
      message: text,
      senderType: "AGENT",
    });
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
        currentUserType="AGENT"
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onEndChat={handleEndChat}
        onCloseChat={handleCloseWindow}
      />
    </div>
  );
}
