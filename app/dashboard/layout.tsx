import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { NotificationSocketProvider } from "@/components/notification-socket-provider";
import { RefineProvider } from "@/components/providers/refine-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <RefineProvider>
      <NotificationSocketProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <div className="flex flex-1 flex-col min-w-0">
            <Header user={session?.user} />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </NotificationSocketProvider>
    </RefineProvider>
  );
}
