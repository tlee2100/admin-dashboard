"use client";

import { useEffect, useState } from "react";
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
    addMessage,
    setConnectionStatus,
    clearChat,
  } = useVisitorChatStore();

  useEffect(() => {
    // If they magically landed here without submitting the form first, send them back
    if (!currentConversation || currentConversation.id !== conversationId) {
      router.push(`/test-chat/${params.siteId}`);
      return;
    }

    // 1. Initialize WebSocket Connection
    // Assuming your NestJS API runs on localhost:3000
    const socketInstance = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
      {
        query: { conversationId }, // This allows the Gateway to let the Visitor in!
      },
    );

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(socketInstance);

    // 2. Bind WebSocket Events to Zustand
    socketInstance.on("connect", () => {
      console.log("Connected to chat server!");
      setConnectionStatus(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from chat server");
      setConnectionStatus(false);
    });

    socketInstance.on(
      "newMessage",
      (payload: {
        conversationId: string;
        message: string;
        senderType: "VISITOR" | "AGENT";
      }) => {
        // payload from server: { conversationId, message, senderType }

        // We only care about messages in this specific conversation
        if (payload.conversationId === conversationId) {
          addMessage({
            id: uuidv4(),
            conversationId: payload.conversationId,
            content: payload.message,
            senderType: payload.senderType,
            createdAt: new Date().toISOString(),
          });
        }
      },
    );

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [
    conversationId,
    currentConversation,
    router,
    params.siteId,
    setConnectionStatus,
    addMessage,
  ]);

  // 3. Handle sending a message FROM the widget TO the server
  const handleSendMessage = (text: string) => {
    if (!socket || !isConnected) return;

    // Immediately add it to our local state so the UI feels instant
    const newLocalMessage = {
      id: uuidv4(),
      conversationId,
      content: text,
      senderType: "VISITOR" as const,
      createdAt: new Date().toISOString(),
    };
    addMessage(newLocalMessage);

    // Emit the event to the server
    socket.emit("sendMessage", {
      conversationId,
      message: text,
      senderType: "VISITOR",
    });
  };

  const handleEndChat = () => {
    if (confirm("Are you sure you want to end this chat?")) {
      if (socket) socket.disconnect();
      clearChat();
      router.push(`/test-chat/${params.siteId}`);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-100 flex items-center justify-center p-4">
      {/* Container to restrict the widget's max width/height to look like a desktop floating widget, 
          but fills the screen on mobile */}
      <div className="w-full max-w-md h-full max-h-[700px] sm:h-[80vh]">
        <ChatWidget
          messages={messages}
          isConnected={isConnected}
          isTyping={isTyping}
          currentUserType="VISITOR"
          onSendMessage={handleSendMessage}
          onEndChat={handleEndChat}
        />
      </div>
    </div>
  );
}
