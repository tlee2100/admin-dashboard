"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/types/chat";
import { MessageBubble } from "./message-bubble";
import { Send, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatWidgetProps {
  messages: ChatMessage[];
  isConnected: boolean;
  isTyping: boolean;
  currentUserType: "VISITOR" | "AGENT";
  onSendMessage: (message: string) => void;
  onEndChat?: () => void; // Used by visitor to end chat
  onCloseChat?: () => void; // Used by agent
  onDeleteChat?: () => void; // Used by agent
  onTyping?: (isTyping: boolean) => void;
  isClosed?: boolean;
  otherPartyOnline?: boolean;
}

export function ChatWidget({
  messages,
  isConnected,
  isTyping,
  currentUserType,
  onSendMessage,
  onEndChat,
  onCloseChat,
  onDeleteChat,
  onTyping,
  isClosed,
  otherPartyOnline,
}: ChatWidgetProps) {
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue("");
    if (onTyping) onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-4 py-3 border-b flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {isConnected ? "Connected" : "Reconnecting..."}
            {otherPartyOnline !== undefined && (
              <span
                className="flex h-2 w-2 relative ml-1"
                title={
                  otherPartyOnline
                    ? "Other party is online"
                    : "Other party is offline"
                }
              >
                <span
                  className={`absolute inline-flex h-2 w-2 animate-ping rounded-full opacity-75 ${
                    otherPartyOnline ? "bg-green-400" : "bg-gray-400"
                  }`}
                ></span>
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    otherPartyOnline ? "bg-green-500" : "bg-gray-500"
                  }`}
                ></span>
              </span>
            )}
          </span>
        </div>

        {onEndChat && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onEndChat}
            disabled={isClosed}
          >
            End Chat
          </Button>
        )}

        {currentUserType === "AGENT" && (
          <div className="flex gap-2">
            {onCloseChat && (
              <Button variant="outline" size="sm" onClick={onCloseChat}>
                Close Window
              </Button>
            )}
            {onDeleteChat && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to permanently delete this chat?",
                    )
                  ) {
                    onDeleteChat();
                  }
                }}
              >
                Delete Chat
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isCurrentUser={msg.senderType === currentUserType}
          />
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm italic pl-10">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-slate-900 p-3 border-t">
        {isClosed ? (
          <div className="p-3 text-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm">
            This conversation is closed. You can no longer send messages.
          </div>
        ) : (
          <div className="flex gap-2 items-end bg-slate-50 dark:bg-slate-950 border rounded-xl focus-within:ring-2 focus-within:ring-primary/50 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all p-1">
            <Textarea
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[40px] max-h-[120px] resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent text-sm py-3"
              rows={1}
              disabled={!isConnected}
            />
            <Button
              size="icon"
              className="rounded-lg mb-1 mr-1 h-9 w-9 shrink-0"
              onClick={handleSend}
              disabled={!inputValue.trim() || !isConnected}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
