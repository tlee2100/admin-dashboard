"use client";

import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types/chat";
import { User, Headset, Check, CheckCheck, Paperclip } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  onReact?: (messageId: string, emoji: string) => void;
}

/** Markdown rendered with scoped styles — used only for AI/Agent messages */
const mdComponents: Components = {
  p: ({ children }) => (
    <p className="mb-1 last:mb-0 leading-relaxed">{children}</p>
  ),
  h1: ({ children }) => (
    <h1 className="text-base font-bold mt-2 mb-1">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold mt-2 mb-1">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold mt-1 mb-0.5">{children}</h3>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    return isBlock ? (
      <code className="block bg-black/10 dark:bg-white/10 rounded px-2 py-1 text-xs font-mono whitespace-pre-wrap my-1 overflow-x-auto">
        {children}
      </code>
    ) : (
      <code className="bg-black/10 dark:bg-white/10 rounded px-1 text-xs font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="my-1 overflow-x-auto">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-current/30 pl-2 italic opacity-80 my-1">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2 opacity-80 hover:opacity-100"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-1 border-current/20" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-1">
      <table className="text-xs border-collapse w-full">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-current/20 px-2 py-0.5 font-semibold bg-black/5 dark:bg-white/5">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-current/20 px-2 py-0.5">{children}</td>
  ),
};

export function MessageBubble({
  message,
  isCurrentUser,
  onReact,
}: MessageBubbleProps) {
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
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
          {message.senderType === "AGENT" ? (
            <Headset className="w-4 h-4 text-primary" />
          ) : (
            <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col gap-1 relative group">
          {onReact && (
            <div
              className={cn(
                "absolute -top-8 hidden group-hover:flex items-center gap-1 bg-white dark:bg-slate-800 border shadow-md rounded-full px-2 py-1 z-10",
                isCurrentUser ? "right-0" : "left-0",
              )}
            >
              {["👍", "❤️", "😂", "😲", "😠"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  className="hover:scale-125 transition-transform text-base"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div
            className={cn(
              "px-4 py-2 rounded-2xl text-sm shadow-sm",
              isCurrentUser
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-white border border-slate-100 dark:border-slate-700 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm",
            )}
          >
            {message.fileUrl && (
              <div className="mb-2 rounded-lg overflow-hidden border bg-white/10">
                {message.fileType?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}${message.fileUrl}`}
                    alt={message.fileName || "attachment"}
                    className="max-w-[200px] max-h-[200px] object-cover"
                  />
                ) : (
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}${message.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 hover:bg-black/5 text-sm"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span className="truncate max-w-[150px] font-medium">
                      {message.fileName || "Download File"}
                    </span>
                  </a>
                )}
              </div>
            )}
            {message.content &&
              (message.senderType === "AI" || message.senderType === "AGENT" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={mdComponents}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              ))}
          </div>

          {/* Knowledge Sources */}
          {message.knowledgeSources && message.knowledgeSources.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="text-[10px] italic text-slate-400 self-center mr-1">
                Sources:
              </span>
              {message.knowledgeSources.map((source, idx) => (
                <span
                  key={`${source.documentId}-${idx}`}
                  className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 rounded text-[9px] font-medium"
                >
                  {source.filename}
                </span>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div
              className={cn(
                "flex flex-wrap gap-1 mt-0.5",
                isCurrentUser ? "justify-end" : "justify-start",
              )}
            >
              {Object.entries(message.reactions).map(([emoji, userIds]) => (
                <button
                  key={emoji}
                  onClick={() => onReact && onReact(message.id, emoji)}
                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-full text-xs flex items-center gap-1 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <span>{emoji}</span>
                  <span className="text-slate-500 font-medium">
                    {userIds.length}
                  </span>
                </button>
              ))}
            </div>
          )}

          <span
            className={cn(
              "text-[10px] text-slate-400 dark:text-slate-500 px-1",
              isCurrentUser ? "text-right" : "text-left",
            )}
          >
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}

            {isCurrentUser && (
              <span className="ml-1 inline-flex items-center">
                {message.status === "READ" ? (
                  <CheckCheck className="w-3 h-3 text-blue-500" />
                ) : message.status === "DELIVERED" ? (
                  <CheckCheck className="w-3 h-3 text-slate-400" />
                ) : (
                  <Check className="w-3 h-3 text-slate-400" />
                )}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
