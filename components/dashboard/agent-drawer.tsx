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

  const isSuperAdmin = session?.user?.role?.toUpperCase() === "SUPER_ADMIN";
  const isAdmin = session?.user?.role?.toUpperCase() === "ADMIN";

  // Fetch all users then filter by role AGENT on client side
  // (backend role filter can be unreliable due to enum casing)
  const { query: agentsQuery } = useList({
    resource: "users",
    pagination: { mode: "server", currentPage: 1, pageSize: 1000 },
    queryOptions: {
      enabled: isSuperAdmin || isAdmin,
    },
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
        throw new Error("Unable to add agent");
      }

      setSelectedAgentId("");
      invalidate({
        resource: "sites",
        invalidates: ["detail", "list"],
        id: siteId,
      });
    } catch (error) {
      console.error(error);
      alert("An error occurred while assigning the agent.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleRemoveAgent = async (agentId: string | number) => {
    if (!siteId) return;
    if (!confirm("Are you sure you want to remove this agent from the site?"))
      return;

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
        throw new Error("Unable to remove agent");
      }

      invalidate({
        resource: "sites",
        invalidates: ["detail", "list"],
        id: siteId,
      });
    } catch (error) {
      console.error(error);
      alert("An error occurred while removing the agent.");
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <Sheet open={!!siteId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto p-6 sm:p-8">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <UsersIcon className="size-5" />
            Agent Management
          </SheetTitle>
          <SheetDescription>
            Assign agents responsible for consulting on website:{" "}
            <span className="font-semibold text-foreground">{siteName}</span>
          </SheetDescription>
        </SheetHeader>

        {/* Add Agent Zone */}
        <CanAccess action="edit" resource="sites" fallback={null}>
          <div className="mb-8 p-4 border rounded-lg bg-muted/20">
            <h3 className="text-sm font-medium mb-3">Add Agent to Site</h3>
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
                    ? "Loading..."
                    : availableAgents.length === 0
                      ? "No agents available"
                      : "--- Select agent ---"}
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
                Add
              </Button>
            </div>
          </div>
        </CanAccess>

        {/* Assigned Agents List */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center justify-between">
            <span>Assigned Agents</span>
            <span className="text-muted-foreground font-normal text-xs">
              {assignedAgents.length} people
            </span>
          </h3>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Agent Name</TableHead>
                  <TableHead className="w-[70px] text-right">Remove</TableHead>
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
                      No agents assigned yet.
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
