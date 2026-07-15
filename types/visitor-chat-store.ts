import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMessage, Conversation } from "../types/chat";

interface VisitorChatState {
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  isConnected: boolean;
  isTyping: boolean;

  setConversation: (
    conversation: Conversation,
    firstMessage?: ChatMessage,
  ) => void;
  addMessage: (message: ChatMessage) => void;
  setConnectionStatus: (status: boolean) => void;
  setTyping: (status: boolean) => void;
  clearChat: () => void;
}

export const useVisitorChatStore = create<VisitorChatState>()(
  persist(
    (set) => ({
      currentConversation: null,
      messages: [],
      isConnected: false,
      isTyping: false,

      setConversation: (conversation, firstMessage) =>
        set({
          currentConversation: conversation,
          messages: firstMessage ? [firstMessage] : [],
        }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      setConnectionStatus: (status) => set({ isConnected: status }),

      setTyping: (status) => set({ isTyping: status }),

      clearChat: () =>
        set({ currentConversation: null, messages: [], isConnected: false }),
    }),
    {
      name: "visitor-chat-storage", // kebab-case for local storage key
      partialize: (state) => ({
        currentConversation: state.currentConversation,
        messages: state.messages,
      }),
    },
  ),
);
