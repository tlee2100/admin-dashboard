"use client";

import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types/chat";
import { User, Headset } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isCurrentUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-[70%] gap-2 items-end",
          isCurrentUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shadow-sm">
          {message.senderType === "AGENT" ? (
            <Headset className="w-4 h-4 text-primary" />
          ) : (
            <User className="w-4 h-4 text-slate-500" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col gap-1">
          <div
            className={cn(
              "px-4 py-2 rounded-2xl text-sm shadow-sm",
              isCurrentUser
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm",
            )}
          >
            {message.content}
          </div>

          <span
            className={cn(
              "text-[10px] text-slate-400 px-1",
              isCurrentUser ? "text-right" : "text-left",
            )}
          >
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
