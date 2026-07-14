"use client";

import { useList, useOne, useInvalidate, CanAccess } from "@refinedev/core";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users as UsersIcon,
  Trash2,
  Plus,
  Loader2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
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

  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isMutating, setIsMutating] = useState(false);

  // Pagination state for assigned agents
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const totalPages = Math.ceil(assignedAgents.length / pageSize) || 1;
  const paginatedAssignedAgents = assignedAgents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

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

  const filteredAgents = availableAgents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAssignAgents = async () => {
    if (!siteId || selectedAgentIds.length === 0) return;
    setIsMutating(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const token = (session as { accessToken?: string })?.accessToken;

      // Execute all assignments in parallel
      const assignPromises = selectedAgentIds.map((agentId) =>
        fetch(`${apiUrl}/sites/${siteId}/agents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ agentId: Number(agentId) }),
        }).then((res) => {
          if (!res.ok) throw new Error(`Failed to assign agent ${agentId}`);
          return res;
        }),
      );

      await Promise.all(assignPromises);

      setSelectedAgentIds([]);
      setSearchTerm("");
      invalidate({
        resource: "sites",
        invalidates: ["detail", "list"],
        id: siteId,
      });
    } catch (error) {
      console.error(error);
      alert("An error occurred while assigning the agents.");
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
            <h3 className="text-sm font-medium mb-3">Add Agents to Site</h3>
            <div className="flex gap-2 items-start relative" ref={dropdownRef}>
              <div className="relative w-full">
                <div
                  className="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors cursor-text focus-within:ring-1 focus-within:ring-ring"
                  onClick={() => setIsDropdownOpen(true)}
                >
                  {selectedAgentIds.map((id) => {
                    const agent = availableAgents.find(
                      (a) => String(a.id) === id,
                    );
                    if (!agent) return null;
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="flex items-center gap-1 font-normal"
                      >
                        {agent.name}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgentIds((prev) =>
                              prev.filter((p) => p !== id),
                            );
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    );
                  })}
                  <input
                    type="text"
                    className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[140px]"
                    placeholder={
                      selectedAgentIds.length === 0
                        ? "Search & select agents..."
                        : ""
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsDropdownOpen(true)}
                    disabled={isAgentsLoading || isMutating}
                  />
                </div>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md p-1">
                    {isAgentsLoading ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Loading...
                      </div>
                    ) : filteredAgents.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No agents found
                      </div>
                    ) : (
                      filteredAgents.map((agent) => {
                        const isSelected = selectedAgentIds.includes(
                          String(agent.id),
                        );
                        return (
                          <div
                            key={agent.id}
                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedAgentIds((prev) =>
                                  prev.filter((id) => id !== String(agent.id)),
                                );
                              } else {
                                setSelectedAgentIds((prev) => [
                                  ...prev,
                                  String(agent.id),
                                ]);
                              }
                            }}
                          >
                            <div
                              className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}
                            >
                              {isSelected && <Check className="size-3" />}
                            </div>
                            <div className="flex flex-col">
                              <span>{agent.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {agent.email}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              <Button
                onClick={handleAssignAgents}
                disabled={selectedAgentIds.length === 0 || isMutating}
                className="shrink-0 gap-1 h-auto py-2"
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
                ) : paginatedAssignedAgents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center py-6 text-muted-foreground text-sm"
                    >
                      No agents assigned yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAssignedAgents.map((agent) => (
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

          {/* Pagination Controls */}
          {assignedAgents.length > pageSize && (
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-3 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  Next <ChevronRight className="size-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
