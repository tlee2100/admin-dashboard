"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";
import { useAgentChatStore } from "@/types/agent-chat-store";
import { Conversation } from "@/types/chat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AgentInboxPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    activeConversations,
    addActiveConversation,
    removeActiveConversation,
    setConversations,
  } = useAgentChatStore();

  useEffect(() => {
    if (!session?.accessToken) return;

    // Fetch existing active conversations for this agent
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/active`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setConversations(data);
        }
      })
      .catch((err) =>
        console.error("Failed to load active conversations:", err),
      );

    // Agent connects with their JWT token for authentication
    const socketInstance = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
      {
        auth: { token: session.accessToken }, // This is how WsJwtGuard authenticates them!
      },
    );

    // Listen for new incoming visitor conversations
    socketInstance.on("newConversation", (conversation: Conversation) => {
      addActiveConversation(conversation);
    });

    // Listen for conversation closed events
    socketInstance.on("conversationClosed", (conversationId: string) => {
      removeActiveConversation(conversationId);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [
    session?.accessToken,
    addActiveConversation,
    removeActiveConversation,
    setConversations,
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Chat Inbox</h1>
          <p className="text-muted-foreground">
            Active visitor conversations waiting for you
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {activeConversations.length} Active
        </Badge>
      </div>

      {activeConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
          <MessageCircle className="w-12 h-12 opacity-30" />
          <p>No active conversations yet.</p>
          <p className="text-sm">Visitors who start a chat will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {activeConversations.map((conv) => (
            <Card key={conv.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{conv.visitorName}</p>
                    <p className="text-sm text-muted-foreground">
                      {conv.visitorEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={conv.status === "OPEN" ? "default" : "secondary"}
                  >
                    {conv.status}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/dashboard/chats/${conv.id}`)}
                  >
                    Join Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
