"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";
import { useTable, useSelect, useInvalidate } from "@refinedev/core";
import { Conversation } from "@/types/chat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AgentInboxPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const invalidate = useInvalidate();

  // Use Refine's useTable hook to fetch, paginate, and filter our resource
  const { tableQuery, currentPage, setCurrentPage, pageCount, setFilters } =
    useTable<Conversation>({
      resource: "chat/conversations/active",
      pagination: {
        currentPage: 1,
        pageSize: 10,
      },
      syncWithLocation: false, // We don't need query params for this internal dashboard view
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

    return () => {
      socketInstance.disconnect();
    };
  }, [session?.accessToken, invalidate]);

  const handleSiteFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "all") {
      setFilters([], "replace");
    } else {
      setFilters(
        [
          {
            field: "siteId",
            operator: "eq",
            value: parseInt(value, 10),
          },
        ],
        "replace",
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Live Chat Inbox</h1>
          <p className="text-muted-foreground">
            Active visitor conversations waiting for you
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            onChange={handleSiteFilter}
            defaultValue="all"
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
            {totalCount} Active
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
                    <p className="text-xs font-medium text-primary/80 mt-1">
                      Site:{" "}
                      {siteOptions?.find((opt) => opt.value == conv.siteId)
                        ?.label || `ID: ${conv.siteId}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={conv.status === "OPEN" ? "default" : "secondary"}
                  >
                    {conv.status}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/dashboard/chats/${conv.id}`)}
                  >
                    Join Chat
                  </Button>
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
