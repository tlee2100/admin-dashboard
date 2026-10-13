"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CanAccess, useList } from "@refinedev/core";
import { Conversation } from "@/types/chat";
import React, { useEffect } from "react";
import { useSidebar } from "@/store/ui-store";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  UserCircle,
  LayoutDashboard,
  Building2,
  Globe,
  FileText,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils"; // hàm merge class của Shadcn

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/users", label: "Users", icon: Users, resource: "users" },
  {
    href: "/dashboard/organizations",
    label: "Organizations",
    icon: Building2,
    resource: "organizations",
  },
  { href: "/dashboard/sites", label: "Sites", icon: Globe, resource: "sites" },
  {
    href: "/dashboard/documents",
    label: "Documents",
    icon: FileText,
    resource: "documents",
  },
  { href: "/dashboard/chats", label: "Live Chats", icon: MessageCircle },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useSidebar();
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    // Run once on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-background transition-all duration-200 z-20 absolute h-full md:relative md:h-auto",
        sidebarOpen
          ? "w-56"
          : "w-0 md:w-14 overflow-hidden md:overflow-visible",
      )}
    >
      <button
        onClick={toggleSidebar}
        className={cn(
          "flex h-12 items-center justify-center border-b text-muted-foreground hover:bg-muted hover:text-foreground",
          !sidebarOpen && "md:flex hidden",
        )}
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarOpen ? (
          <PanelLeftClose className="size-4" />
        ) : (
          <PanelLeftOpen className="size-4" />
        )}
      </button>
      <nav className="flex flex-col gap-1 p-2 mt-2">
        {navItems.map(({ href, label, icon: Icon, resource }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          const linkNode = (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                !sidebarOpen && "justify-center",
              )}
              title={label}
            >
              <Icon className="size-4 shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          );

          if (resource) {
            return (
              <CanAccess
                key={href}
                resource={resource}
                action="list"
                fallback={null}
              >
                {linkNode}
              </CanAccess>
            );
          }

          return <React.Fragment key={href}>{linkNode}</React.Fragment>;
        })}
      </nav>

      {/* Active Chats Section */}
      {sidebarOpen && (
        <div className="mt-4 px-4 flex flex-col overflow-hidden">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Active Chats
          </div>
          <ActiveChatsList />
        </div>
      )}
    </aside>
  );
}

function ActiveChatsList() {
  const pathname = usePathname();

  const { data: queryResult, isLoading } = useList<Conversation>({
    resource: "chat/conversations/active",
    pagination: {
      currentPage: 1,
      pageSize: 5,
    },
    sorters: [
      {
        field: "lastActivityAt",
        order: "desc",
      },
    ],
    filters: [
      {
        field: "status",
        operator: "eq",
        value: "OPEN",
      },
    ],
  }).query;

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  const conversations = queryResult?.data || [];

  if (conversations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No active chats
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto max-h-[250px] pr-1">
      {conversations.map((conv) => {
        const href = `/dashboard/chats/${conv.id}`;
        const active = pathname === href;
        return (
          <Link
            key={conv.id}
            href={href}
            className={cn(
              "flex flex-col rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted",
              active
                ? "bg-muted border-l-2 border-primary"
                : "text-muted-foreground",
            )}
            title={conv.visitorName}
          >
            <div className="flex justify-between items-center w-full">
              <span className="truncate flex-1 font-semibold text-foreground">
                {conv.visitorName}
              </span>
              <span className="text-[10px] whitespace-nowrap opacity-70 ml-2">
                {new Date(conv.lastActivityAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {conv.latestMessage && (
              <span className="truncate text-xs font-normal opacity-80 mt-0.5 italic">
                {conv.latestMessage.content}
              </span>
            )}
          </Link>
        );
      })}
      <Link
        href="/dashboard/chats"
        className="text-xs text-primary mt-2 hover:underline"
      >
        View all chats
      </Link>
    </div>
  );
}
