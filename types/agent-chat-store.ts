import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMessage, Conversation } from "../types/chat";

interface AgentChatState {
  activeConversations: Conversation[];
  messagesByConversation: Record<string, ChatMessage[]>;
  notifications: string[];

  setConversations: (conversations: Conversation[]) => void;
  addActiveConversation: (conversation: Conversation) => void;
  removeActiveConversation: (conversationId: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  addNotification: (message: string) => void;
  clearNotifications: () => void;
}

export const useAgentChatStore = create<AgentChatState>()(
  persist(
    (set) => ({
      activeConversations: [],
      messagesByConversation: {},
      notifications: [],

      setConversations: (conversations) =>
        set({ activeConversations: conversations }),

      addActiveConversation: (conversation) =>
        set((state) => {
          if (state.activeConversations.some((c) => c.id === conversation.id))
            return state;
          return {
            activeConversations: [...state.activeConversations, conversation],
          };
        }),

      removeActiveConversation: (conversationId) =>
        set((state) => ({
          activeConversations: state.activeConversations.filter(
            (c) => c.id !== conversationId,
          ),
        })),

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

      addNotification: (message) =>
        set((state) => ({ notifications: [...state.notifications, message] })),

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "agent-chat-storage",
      partialize: (state) => ({
        activeConversations: state.activeConversations,
        messagesByConversation: state.messagesByConversation,
      }),
    },
  ),
);
