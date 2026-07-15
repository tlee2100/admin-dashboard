import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMessage } from "../types/chat";

interface AgentChatState {
  messagesByConversation: Record<string, ChatMessage[]>;
  typingStatuses: Record<string, boolean>;
  notifications: string[];

  addMessage: (conversationId: string, message: ChatMessage) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  addNotification: (message: string) => void;
  clearNotifications: () => void;
}

export const useAgentChatStore = create<AgentChatState>()(
  persist(
    (set) => ({
      messagesByConversation: {},
      typingStatuses: {},
      notifications: [],

      addMessage: (conversationId, message) =>
        set((state) => {
          const existingMessages =
            state.messagesByConversation[conversationId] || [];
          return {
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: [...existingMessages, message],
            },
          };
        }),

      setMessages: (conversationId, messages) =>
        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: messages,
          },
        })),

      setTyping: (conversationId, isTyping) =>
        set((state) => ({
          typingStatuses: {
            ...state.typingStatuses,
            [conversationId]: isTyping,
          },
        })),

      addNotification: (message) =>
        set((state) => ({ notifications: [...state.notifications, message] })),

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "agent-chat-storage",
      partialize: (state) => ({
        messagesByConversation: state.messagesByConversation,
      }),
    },
  ),
);
