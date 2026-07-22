"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { useTable, useSelect, useInvalidate, CanAccess } from "@refinedev/core";
import { Conversation } from "@/types/chat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageCircle,
  User,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const getInitialFilter = (field: string, defaultValue: string = "") => {
  if (typeof window === "undefined") return defaultValue;
  const params = new URLSearchParams(window.location.search);
  for (const [key, val] of params.entries()) {
    if (key.includes("[field]") && val === field) {
      const match = key.match(/filters\[(\d+)\]/);
      if (match)
        return params.get(`filters[${match[1]}][value]`) || defaultValue;
    }
  }
  return defaultValue;
};

export default function AgentInboxPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const invalidate = useInvalidate();

  const [siteFilter, setSiteFilter] = useState<string>(() =>
    getInitialFilter("siteId", "all"),
  );
  const [statusFilter, setStatusFilter] = useState<string>(() =>
    getInitialFilter("status", "OPEN"),
  );

  const socketRef = useRef<Socket | null>(null);

  // Use Refine's useTable hook to fetch, paginate, and filter our resource
  const { tableQuery, currentPage, setCurrentPage, pageCount, setFilters } =
    useTable<Conversation>({
      resource: "chat/conversations/active",
      pagination: {
        currentPage: 1,
        pageSize: 10,
      },
      filters: {
        initial: [
          {
            field: "status",
            operator: "eq",
            value: "OPEN",
          },
        ],
      },
      sorters: {
        initial: [
          {
            field: "lastActivityAt",
            order: "desc",
          },
        ],
      },
      syncWithLocation: true,
    });

  const { data, isLoading } = tableQuery;
  const activeConversations = data?.data || [];
  const totalCount = data?.total || 0;

  // Use Refine's useSelect hook to fetch the agent's sites for the filter dropdown
  const { options: siteOptions } = useSelect({
    resource: "sites",
    optionLabel: "name",
    optionValue: "id",
  });

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Sync local state filters to Refine
    const filters = [];
    if (siteFilter !== "all") {
      filters.push({
        field: "siteId",
        operator: "eq",
        value: parseInt(siteFilter, 10),
      });
    }
    if (statusFilter !== "all") {
      filters.push({
        field: "status",
        operator: "eq",
        value: statusFilter,
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFilters(filters as any, "replace");
    setCurrentPage(1);
  }, [siteFilter, statusFilter, setFilters, setCurrentPage]);

  // Socket setup for real-time invalidation
  useEffect(() => {
    if (!session?.accessToken) return;

    const socketInstance = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
      {
        auth: { token: session.accessToken },
      },
    );

    // Instead of manually managing state, we just tell Refine to invalidate and refetch!
    socketInstance.on("newConversation", () => {
      invalidate({
        resource: "chat/conversations/active",
        invalidates: ["list"],
      });
    });

    socketInstance.on("conversationClosed", () => {
      invalidate({
        resource: "chat/conversations/active",
        invalidates: ["list"],
      });
    });

    socketInstance.on("conversationAssigned", () => {
      invalidate({
        resource: "chat/conversations/active",
        invalidates: ["list"],
      });
    });

    socketInstance.on("conversationActivity", () => {
      invalidate({
        resource: "chat/conversations/active",
        invalidates: ["list"],
      });
    });

    socketInstance.on("aiToggled", () => {
      invalidate({
        resource: "chat/conversations/active",
        invalidates: ["list"],
      });
    });

    socketRef.current = socketInstance;

    return () => {
      socketRef.current = null;
      socketInstance.disconnect();
    };
  }, [session?.accessToken, invalidate]);

  const handleDeleteChat = async (conversationId: string) => {
    if (!session?.accessToken) return;
    if (!confirm("Are you sure you want to permanently delete this chat?"))
      return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );
      if (res.ok) {
        invalidate({
          resource: "chat/conversations/active",
          invalidates: ["list"],
        });
      } else {
        alert("Failed to delete chat");
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting chat");
    }
  };

  const handleToggleAi = (conversationId: string, currentStatus: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit("toggleAi", {
        conversationId,
        isAiActive: !currentStatus,
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Live Chat Inbox</h1>
          <p className="text-muted-foreground">
            Manage your visitor conversations
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 w-full sm:w-[130px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="OPEN">Open</option>
            <option value="PAUSED">Paused</option>
            <option value="CLOSED">Closed</option>
            <option value="all">All Status</option>
          </select>

          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="flex h-10 w-full sm:w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">All Sites</option>
            {siteOptions?.map((option) => (
              <option key={option.value} value={option.value.toString()}>
                {option.label}
              </option>
            ))}
          </select>

          <Badge variant="secondary" className="text-sm px-3 py-1 shrink-0">
            {totalCount} Total
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : activeConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
          <MessageCircle className="w-12 h-12 opacity-30" />
          <p>No active conversations found.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {activeConversations.map((conv) => (
            <Card key={conv.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{conv.visitorName}</p>
                    <p className="text-sm text-muted-foreground">
                      {conv.visitorEmail}
                    </p>
                    {conv.latestMessage && (
                      <p className="text-sm text-foreground mt-1 line-clamp-1 italic">
                        &quot;{conv.latestMessage.content}&quot;
                      </p>
                    )}
                    <p className="text-xs font-medium text-primary/80 mt-1">
                      Site:{" "}
                      {siteOptions?.find((opt) => opt.value == conv.siteId)
                        ?.label || `ID: ${conv.siteId}`}
                      {" • "}
                      {new Date(conv.lastActivityAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={conv.status === "OPEN" ? "default" : "secondary"}
                  >
                    {conv.status}
                  </Badge>
                  {conv.status === "OPEN" && conv.handlingStatus && (
                    <Badge
                      variant={
                        conv.handlingStatus === "WAITING_FOR_AGENT"
                          ? "destructive"
                          : conv.handlingStatus === "AGENT_HANDLING"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {conv.handlingStatus.replace(/_/g, " ")}
                    </Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={conv.isAiActive ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        handleToggleAi(conv.id, conv.isAiActive ?? true)
                      }
                      className="flex items-center gap-1"
                      title={
                        conv.isAiActive ? "AI Reply is ON" : "AI Reply is OFF"
                      }
                    >
                      <Bot className="w-4 h-4" />
                      {conv.isAiActive ? "AI: ON" : "AI: OFF"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/dashboard/chats/${conv.id}`)}
                    >
                      View
                    </Button>
                    <CanAccess
                      action="delete"
                      resource="chat/conversations/active"
                      params={{ conversation: conv }}
                    >
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteChat(conv.id)}
                        title="Delete Chat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CanAccess>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination Controls */}
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground mx-2">
                Page {currentPage} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pageCount}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
