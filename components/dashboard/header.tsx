"use client";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type HeaderUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

function initials(name?: string | null, email?: string | null) {
  const source = name || email || "?";
  return source.slice(0, 2).toUpperCase();
}

export function Header({ user }: { user?: HeaderUser }) {
  return (
    <header className="flex h-12 items-center justify-between border-b px-4">
      <div />
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-1.5 py-1 outline-none hover:bg-muted">
          <Avatar size="sm">
            <AvatarFallback>{initials(user?.name, user?.email)}</AvatarFallback>
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
          <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
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
    </header>
  );
}
