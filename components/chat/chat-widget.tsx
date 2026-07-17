"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { ChatMessage } from "@/types/chat";
import { MessageBubble } from "./message-bubble";
import {
  Send,
  Wifi,
  WifiOff,
  Pause,
  Play,
  Paperclip,
  Loader2,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatWidgetProps {
  messages: ChatMessage[];
  isConnected: boolean;
  isTyping: boolean;
  currentUserType: "VISITOR" | "AGENT";
  onSendMessage: (
    message: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string,
  ) => void;
  onEndChat?: () => void; // Used by visitor to end chat
  onCloseChat?: () => void; // Used by agent
  onDeleteChat?: () => void; // Used by agent
  onPauseChat?: () => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  onLoadMore?: () => void | Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  onToggleAi?: (isActive: boolean) => void;
  isClosed?: boolean;
  isPaused?: boolean;
  isAiActive?: boolean;
  otherPartyOnline?: boolean;
  hasMore?: boolean;
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
  onToggleAi,
  isClosed,
  isPaused,
  isAiActive,
  otherPartyOnline,
  onPauseChat,
  onReactMessage,
  onLoadMore,
  hasMore,
}: ChatWidgetProps) {
  const [inputValue, setInputValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPrependingRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom only for NEW messages (not when prepending history)
  useEffect(() => {
    if (isPrependingRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // After prepending older messages, restore the scroll position synchronously before paint
  useLayoutEffect(() => {
    if (!isPrependingRef.current) return;
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop =
        container.scrollHeight - prevScrollHeightRef.current;
    }
    // Delay resetting so the auto-scroll useEffect sees it as true and bails out
    setTimeout(() => {
      isPrependingRef.current = false;
    }, 0);
  }, [messages]);

  // Called by parent right BEFORE prepending older messages
  const prepareForPrepend = useCallback(() => {
    isPrependingRef.current = true;
    prevScrollHeightRef.current = scrollContainerRef.current?.scrollHeight ?? 0;
  }, []);

  const handleLoadMoreClick = async () => {
    if (onLoadMore && !isFetchingHistory) {
      setIsFetchingHistory(true);
      prepareForPrepend();
      try {
        await onLoadMore();
      } finally {
        setIsFetchingHistory(false);
        // Fallback: reset the ref if no messages were actually added
        setTimeout(() => {
          isPrependingRef.current = false;
        }, 100);
      }
    }
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    // Pre-validate file sizes
    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        alert("The file is out of limit 10MB");
        return;
      }
    }

    setIsUploading(true);
    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/chat/upload`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (res.status === 413) {
          throw new Error("The file is out of limit");
        }
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();

        // Only send the text input with the first file
        const textToSend = i === 0 ? inputValue.trim() : "";
        onSendMessage(textToSend, data.url, data.fileName, data.fileType);
      }

      // Clear input after sending all files
      setInputValue("");
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        alert(err.message || "Failed to upload files");
      } else {
        alert("Failed to upload files");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

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

        <div className="flex items-center gap-2">
          {onPauseChat && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPauseChat}
              disabled={isClosed}
              className="flex items-center gap-1"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4" /> Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              )}
            </Button>
          )}

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
        </div>

        {currentUserType === "AGENT" && (
          <div className="flex gap-2 ml-2">
            {onToggleAi && (
              <Button
                variant={isAiActive ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleAi(!isAiActive)}
                className="flex items-center gap-1"
                title={isAiActive ? "AI Reply is ON" : "AI Reply is OFF"}
              >
                <Bot className="w-4 h-4" />
                {isAiActive ? "AI: ON" : "AI: OFF"}
              </Button>
            )}
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
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {onLoadMore && hasMore && (
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMoreClick}
              disabled={isFetchingHistory}
              className="text-xs rounded-full bg-white dark:bg-slate-800 shadow-sm"
            >
              {isFetchingHistory ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more messages"
              )}
            </Button>
          </div>
        )}

        {isDragging && (
          <div className="absolute inset-0 z-20 bg-primary/10 border-2 border-dashed border-primary rounded-xl flex items-center justify-center backdrop-blur-sm m-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col items-center">
              <Paperclip className="w-8 h-8 text-primary mb-2" />
              <p className="font-medium text-primary">Drop file here to send</p>
            </div>
          </div>
        )}

        {isPaused && !isClosed && (
          <div className="mx-auto w-fit py-1 px-3 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-xs font-medium rounded-full mb-4">
            Chat is paused
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isCurrentUser={msg.senderType === currentUserType}
            onReact={onReactMessage}
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
            <label className="cursor-pointer p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg shrink-0 mb-0.5 ml-0.5">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
                disabled={!isConnected || isUploading}
              />
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4 text-slate-500" />
              )}
            </label>
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
              disabled={(!inputValue.trim() && !isUploading) || !isConnected}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
