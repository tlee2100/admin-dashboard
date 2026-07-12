"use client";

import { useList, useOne, useInvalidate, CanAccess } from "@refinedev/core";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Users as UsersIcon, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface AgentDrawerProps {
  siteId: string | null;
  siteName?: string;
  onClose: () => void;
}

export function AgentDrawer({ siteId, siteName, onClose }: AgentDrawerProps) {
  const { data: session } = useSession();
  const invalidate = useInvalidate();

  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isMutating, setIsMutating] = useState(false);

  // Fetch all users then filter by role AGENT on client side
  // (backend role filter can be unreliable due to enum casing)
  const { query: agentsQuery } = useList({
    resource: "users",
    pagination: { mode: "server", currentPage: 1, pageSize: 1000 },
  });

  const isAgentsLoading = agentsQuery.isLoading;
  const allUsers =
    (agentsQuery.data?.data as {
      id: string | number;
      role: string;
      email: string;
      name: string;
    }[]) || [];
  const allAgents = allUsers.filter(
    (u) => String(u.role).toUpperCase() === "AGENT",
  );

  // Fetch current site details to get assigned agents
  const { query: siteQuery } = useOne({
    resource: "sites",
    id: siteId || "",
    queryOptions: {
      enabled: !!siteId,
    },
  });

  const isSiteLoading = siteQuery.isLoading;
  const assignedAgents =
    (siteQuery.data?.data?.agents as {
      id: string | number;
      email: string;
      name: string;
    }[]) || [];

  // DEBUG
  console.log("[AgentDrawer] siteId:", siteId);
  console.log("[AgentDrawer] siteQuery.data:", siteQuery.data);
  console.log("[AgentDrawer] assignedAgents:", assignedAgents);
  console.log("[AgentDrawer] allUsers count:", allUsers.length);
  console.log("[AgentDrawer] allAgents (AGENT role):", allAgents);

  // Filter out agents that are already assigned
  const availableAgents = allAgents.filter(
    (agent) => !assignedAgents.some((assigned) => assigned.id === agent.id),
  );

  const handleAssignAgent = async () => {
    if (!siteId || !selectedAgentId) return;
    setIsMutating(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/sites/${siteId}/agents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as { accessToken?: string })?.accessToken}`,
          },
          body: JSON.stringify({ agentId: Number(selectedAgentId) }),
        },
      );

      if (!res.ok) {
        throw new Error("Không thể thêm nhân viên");
      }

      setSelectedAgentId("");
      invalidate({
        resource: "sites",
        invalidates: ["detail", "list"],
        id: siteId,
      });
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi gán nhân viên.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleRemoveAgent = async (agentId: string | number) => {
    if (!siteId) return;
    if (!confirm("Bạn có chắc chắn muốn gỡ nhân viên này khỏi site?")) return;

    setIsMutating(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/sites/${siteId}/agents/${agentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${(session as { accessToken?: string })?.accessToken}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Không thể gỡ nhân viên");
      }

      invalidate({
        resource: "sites",
        invalidates: ["detail", "list"],
        id: siteId,
      });
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi gỡ nhân viên.");
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <Sheet open={!!siteId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <UsersIcon className="size-5" />
            Quản lý Nhân viên
          </SheetTitle>
          <SheetDescription>
            Phân công nhân viên phụ trách tư vấn cho trang web:{" "}
            <span className="font-semibold text-foreground">{siteName}</span>
          </SheetDescription>
        </SheetHeader>

        {/* Add Agent Zone */}
        <CanAccess action="edit" resource="sites" fallback={null}>
          <div className="mb-8 p-4 border rounded-lg bg-muted/20">
            <h3 className="text-sm font-medium mb-3">
              Thêm nhân viên vào Site
            </h3>
            <div className="flex gap-2">
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  isAgentsLoading || isMutating || availableAgents.length === 0
                }
              >
                <option value="">
                  {isAgentsLoading
                    ? "Đang tải..."
                    : availableAgents.length === 0
                      ? "Không còn nhân viên nào"
                      : "--- Chọn nhân viên ---"}
                </option>
                {availableAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.email})
                  </option>
                ))}
              </select>
              <Button
                onClick={handleAssignAgent}
                disabled={!selectedAgentId || isMutating}
                className="shrink-0 gap-1"
              >
                {isMutating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}{" "}
                Thêm
              </Button>
            </div>
          </div>
        </CanAccess>

        {/* Assigned Agents List */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center justify-between">
            <span>Danh sách nhân viên phụ trách</span>
            <span className="text-muted-foreground font-normal text-xs">
              {assignedAgents.length} người
            </span>
          </h3>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Tên nhân viên</TableHead>
                  <TableHead className="w-[70px] text-right">Gỡ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSiteLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center py-6 text-muted-foreground text-sm"
                    >
                      <Loader2 className="size-4 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : assignedAgents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center py-6 text-muted-foreground text-sm"
                    >
                      Chưa có nhân viên nào được phân công.
                    </TableCell>
                  </TableRow>
                ) : (
                  assignedAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium text-sm">
                        <div>{agent.name}</div>
                        <div className="text-xs text-muted-foreground font-normal">
                          {agent.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <CanAccess
                          action="edit"
                          resource="sites"
                          fallback={null}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveAgent(agent.id)}
                            disabled={isMutating}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </CanAccess>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
