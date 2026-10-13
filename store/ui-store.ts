import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: "ui-store",
    },
  ),
);

const emptySubscribe = () => () => {};

/**
 * Hook that safely returns the persisted sidebar state on the client
 * while matching the default desktop state (open) during SSR to prevent hydration errors.
 */
export function useSidebar() {
  const store = useUIStore();
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  return {
    sidebarOpen: isHydrated ? store.sidebarOpen : true,
    toggleSidebar: store.toggleSidebar,
    setSidebarOpen: store.setSidebarOpen,
    isHydrated,
  };
}
