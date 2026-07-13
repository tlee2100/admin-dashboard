"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CanAccess } from "@refinedev/core";
import React, { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  UserCircle,
  LayoutDashboard,
  Building2,
  Globe,
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
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
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
    </aside>
  );
}
