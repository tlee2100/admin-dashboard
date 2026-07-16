import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMessage } from "../types/chat";

interface AgentChatState {
  messagesByConversation: Record<string, ChatMessage[]>;
  typingStatuses: Record<string, boolean>;
  pendingMessages: Record<string, string[]>;
  otherPartyOnline: Record<string, boolean>;
  notifications: string[];

  addMessage: (conversationId: string, message: ChatMessage) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  prependMessages: (conversationId: string, messages: ChatMessage[]) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  updateMessageStatus: (
    conversationId: string,
    messageId: string,
    status: string,
  ) => void;
  updateMessageReactions: (
    conversationId: string,
    messageId: string,
    reactions: Record<string, string[]>,
  ) => void;
  addPendingMessage: (conversationId: string, message: string) => void;
  clearPendingMessages: (conversationId: string) => void;
  setOtherPartyOnline: (conversationId: string, online: boolean) => void;
  addNotification: (message: string) => void;
  clearNotifications: () => void;
}

export const useAgentChatStore = create<AgentChatState>()(
  persist(
    (set) => ({
      messagesByConversation: {},
      typingStatuses: {},
      pendingMessages: {},
      otherPartyOnline: {},
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

      prependMessages: (conversationId, messages) =>
        set((state) => {
          const existingMessages =
            state.messagesByConversation[conversationId] || [];
          return {
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: [...messages, ...existingMessages],
            },
          };
        }),

      setTyping: (conversationId, isTyping) =>
        set((state) => ({
          typingStatuses: {
            ...state.typingStatuses,
            [conversationId]: isTyping,
          },
        })),

      updateMessageStatus: (conversationId, messageId, status) =>
        set((state) => {
          const messages = state.messagesByConversation[conversationId] || [];
          return {
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: messages.map((m) =>
                m.id === messageId ? { ...m, status } : m,
              ),
            },
          };
        }),

      updateMessageReactions: (conversationId, messageId, reactions) =>
        set((state) => {
          const messages = state.messagesByConversation[conversationId] || [];
          return {
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: messages.map((m) =>
                m.id === messageId ? { ...m, reactions } : m,
              ),
            },
          };
        }),

      addPendingMessage: (conversationId, message) =>
        set((state) => {
          const pending = state.pendingMessages[conversationId] || [];
          return {
            pendingMessages: {
              ...state.pendingMessages,
              [conversationId]: [...pending, message],
            },
          };
        }),

      clearPendingMessages: (conversationId) =>
        set((state) => ({
          pendingMessages: {
            ...state.pendingMessages,
            [conversationId]: [],
          },
        })),

      setOtherPartyOnline: (conversationId, online) =>
        set((state) => ({
          otherPartyOnline: {
            ...state.otherPartyOnline,
            [conversationId]: online,
          },
        })),

      addNotification: (message) =>
        set((state) => ({ notifications: [...state.notifications, message] })),

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "agent-chat-storage",
      partialize: (state) => ({
        // Only persist pending (offline) messages — chat history is always fetched fresh from the server
        pendingMessages: state.pendingMessages,
      }),
    },
  ),
);
