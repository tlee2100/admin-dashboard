import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { NotificationSocketProvider } from "@/components/notification-socket-provider";

// Server Component (không "use client") → gọi auth() trực tiếp, không cần useSession()
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <NotificationSocketProvider>
          <Header user={session?.user} />
        </NotificationSocketProvider>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
