import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ChatMessage, Conversation } from "@/types/chat";
import type { UIMessage } from "ai";

interface VisitorChatState {
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  isConnected: boolean;
  isTyping: boolean;
  pendingMessages: string[];
  otherPartyOnline: boolean;
  streamingMessages: UIMessage[];

  setConversation: (
    conversation: Conversation,
    firstMessage?: ChatMessage,
  ) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  prependMessages: (messages: ChatMessage[]) => void;
  setConnectionStatus: (status: boolean) => void;
  setConversationStatus: (status: "OPEN" | "PAUSED" | "CLOSED") => void;
  updateConversation: (updates: Partial<Conversation>) => void;
  setTyping: (status: boolean) => void;
  updateMessageStatus: (messageId: string, status: string) => void;
  updateMessageReactions: (
    messageId: string,
    reactions: Record<string, string[]>,
  ) => void;
  replaceMessageId: (localId: string, realId: string, status?: string) => void;
  addPendingMessage: (message: string) => void;
  clearPendingMessages: () => void;
  setOtherPartyOnline: (online: boolean) => void;
  clearChat: () => void;
  setStreamingMessages: (messages: UIMessage[]) => void;
}

export const useVisitorChatStore = create<VisitorChatState>()(
  persist(
    (set) => ({
      currentConversation: null,
      messages: [],
      isConnected: false,
      isTyping: false,
      pendingMessages: [],
      otherPartyOnline: false,
      streamingMessages: [],

      setConversation: (conversation, firstMessage) =>
        set({
          currentConversation: conversation,
          messages: firstMessage ? [firstMessage] : [],
        }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      setMessages: (messages) => set({ messages }),

      prependMessages: (messages) =>
        set((state) => ({ messages: [...messages, ...state.messages] })),

      setConnectionStatus: (status) => set({ isConnected: status }),

      setConversationStatus: (status) =>
        set((state) => ({
          currentConversation: state.currentConversation
            ? { ...state.currentConversation, status }
            : null,
        })),

      updateConversation: (updates) =>
        set((state) => ({
          currentConversation: state.currentConversation
            ? { ...state.currentConversation, ...updates }
            : null,
        })),

      setTyping: (status) => set({ isTyping: status }),

      updateMessageStatus: (messageId, status) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, status } : m,
          ),
        })),

      updateMessageReactions: (messageId, reactions) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, reactions } : m,
          ),
        })),

      replaceMessageId: (localId, realId, status) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === localId
              ? { ...m, id: realId, status: status ?? m.status }
              : m,
          ),
        })),

      addPendingMessage: (message) =>
        set((state) => ({
          pendingMessages: [...state.pendingMessages, message],
        })),

      clearPendingMessages: () => set({ pendingMessages: [] }),

      setOtherPartyOnline: (online) => set({ otherPartyOnline: online }),

      clearChat: () =>
        set({
          currentConversation: null,
          messages: [],
          isConnected: false,
          streamingMessages: [],
        }),

      setStreamingMessages: (messages) => set({ streamingMessages: messages }),
    }),
    {
      name: "visitor_chat_storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentConversation: state.currentConversation,
        messages: state.messages,
        pendingMessages: state.pendingMessages,
        streamingMessages: state.streamingMessages,
      }),
    },
  ),
);
