import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMessage } from "../types/chat";

interface AgentChatState {
  messagesByConversation: Record<string, ChatMessage[]>;
  notifications: string[];

  addMessage: (conversationId: string, message: ChatMessage) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  addNotification: (message: string) => void;
  clearNotifications: () => void;
}

export const useAgentChatStore = create<AgentChatState>()(
  persist(
    (set) => ({
      messagesByConversation: {},
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
