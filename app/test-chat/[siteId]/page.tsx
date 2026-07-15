"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useVisitorChatStore } from "@/types/visitor-chat-store";
import { Send, MessageSquare } from "lucide-react";

// Import shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ChatLandingPage() {
  const router = useRouter();
  const params = useParams();
  const siteId = params.siteId as string;
  const setConversation = useVisitorChatStore((state) => state.setConversation);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    firstMessage: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call the real NestJS API to create the conversation in the DB
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId: parseInt(siteId, 10),
            visitorName: formData.name,
            visitorEmail: formData.email,
            firstMessage: formData.firstMessage,
          }),
        },
      );

      if (!res.ok) {
        throw new Error(`Failed to start chat: ${res.statusText}`);
      }

      const data = await res.json();

      // Store conversation info in Zustand
      setConversation(
        {
          id: data.conversationId,
          siteId: data.siteId,
          status: "OPEN" as const,
          visitorName: data.visitorName,
          visitorEmail: data.visitorEmail,
        },
        {
          id: data.firstMessage.id,
          conversationId: data.conversationId,
          senderType: "VISITOR" as const,
          content: data.firstMessage.content,
          createdAt: data.firstMessage.createdAt,
        },
      );

      router.push(`/test-chat/${siteId}/${data.conversationId}`);
    } catch (error) {
      console.error("Failed to start chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-slate-200 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <MessageSquare className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Hi there! 👋</CardTitle>
          <CardDescription>
            We&apos;re here to help. Please fill out the short form below to
            start chatting with our team.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Name
              </label>
              <Input
                id="name"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="message"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                How can we help?
              </label>
              <Textarea
                id="message"
                required
                rows={3}
                className="resize-none"
                placeholder="Type your message here..."
                value={formData.firstMessage}
                onChange={(e) =>
                  setFormData({ ...formData, firstMessage: e.target.value })
                }
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Start Chat
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
