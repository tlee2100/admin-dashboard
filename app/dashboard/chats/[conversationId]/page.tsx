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
  const { messagesByConversation, addMessage } = useAgentChatStore();
  const messages = messagesByConversation[conversationId] || [];

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

    return () => {
      socketInstance.disconnect();
    };
  }, [session?.accessToken, conversationId, addMessage, router]);

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

  return (
    <div className="h-[calc(100vh-4rem)] p-4">
      <ChatWidget
        messages={messages}
        isConnected={isConnected}
        isTyping={false}
        currentUserType="AGENT"
        onSendMessage={handleSendMessage}
        // No onEndChat here — only visitor ends the chat
      />
    </div>
  );
}
