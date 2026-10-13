"use client";
import { signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";
import { useSidebar } from "@/store/ui-store";
import { Breadcrumb } from "./breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notification-bell";
import { ConnectionStatus } from "@/components/connection-status";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type HeaderUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
};

function initials(name?: string | null, email?: string | null) {
  const source = name || email || "?";
  return source.slice(0, 2).toUpperCase();
}

export function Header({ user }: { user?: HeaderUser }) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex h-12 items-center justify-between border-b px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
          onClick={toggleSidebar}
        >
          <Menu className="size-5" />
        </button>
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-3">
        <ConnectionStatus />
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-1.5 py-1 outline-none hover:bg-muted">
            <Avatar size="sm">
              <AvatarImage
                src={
                  user?.avatarUrl
                    ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatarUrl}`
                    : undefined
                }
              />
              <AvatarFallback>
                {initials(user?.name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {user?.name ?? user?.email}
            </span>
            {user?.role && (
              <Badge variant="outline" className="capitalize">
                {user.role}
              </Badge>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
