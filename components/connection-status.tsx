"use client";
import { useNotificationsStore } from "@/lib/store/notifications-store";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  connected: { color: "bg-green-500", label: "Đã kết nối" },
  connecting: { color: "bg-yellow-500 animate-pulse", label: "Đang kết nối" },
  disconnected: { color: "bg-red-500", label: "Mất kết nối" },
} as const;

export function ConnectionStatus() {
  const status = useNotificationsStore((s) => s.status);
  const config = STATUS_CONFIG[status];

  return (
    <span
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      title={config.label}
    >
      <span className={cn("size-2 rounded-full", config.color)} />
      {config.label}
    </span>
  );
}
