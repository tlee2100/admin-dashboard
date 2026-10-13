"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { useNotificationsStore } from "@/store/notifications-store";
import { toast } from "sonner";

export function NotificationSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const setStatus = useNotificationsStore((s) => s.setStatus);
  const addNotification = useNotificationsStore((s) => s.addNotification);

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session?.accessToken) return;

    setStatus("connecting");
    const socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token: session.accessToken },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("disconnected"));
    socket.on("notification", (payload) => {
      addNotification(payload);
      toast.info(payload.title, { description: payload.message });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // Effect chạy lại mỗi khi session.accessToken đổi (sau khi jwt() callback
    // refresh) — vì server chỉ verify token DUY NHẤT lúc handshake, không
    // re-check giữa chừng, nên nếu accessToken cũ hết hạn mà socket vẫn đang
    // mở thì kết nối đó VẪN SỐNG cho tới khi client tự disconnect/reconnect.
    // Đây là hạn chế cần biết: muốn "chặt đứt" ngay khi accessToken hết hạn
    // thật sự (vd sau khi revoke refresh token) thì cần thêm cơ chế server
    // chủ động disconnect (tự lưu map token→socket, hoặc set timeout theo
    // accessTokenExpires) — có thể làm nếu bạn thấy cần trong thực tế.
  }, [session?.accessToken, sessionStatus, setStatus, addNotification]);

  return <>{children}</>;
}
