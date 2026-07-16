import { create } from "zustand";

export type NotificationPayload = {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface NotificationsState {
  status: ConnectionStatus;
  notifications: NotificationPayload[];
  unreadCount: number;
  setStatus: (status: ConnectionStatus) => void;
  addNotification: (n: NotificationPayload) => void;
  markAllRead: () => void;
}

// Chỉ giữ tối đa 50 noti trong bộ nhớ — không lưu DB nên không giới hạn
// sẽ khiến tab mở lâu ngày phình RAM
const MAX_NOTIFICATIONS = 50;

export const useNotificationsStore = create<NotificationsState>((set) => ({
  status: "connecting",
  notifications: [],
  unreadCount: 0,
  setStatus: (status) => set({ status }),
  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
      unreadCount: state.unreadCount + 1,
    })),
  markAllRead: () => set({ unreadCount: 0 }),
}));
