"use client";

import { useTable, useDelete, CanAccess, useSelect } from "@refinedev/core";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentDrawer } from "@/components/dashboard/document-drawer";
import { AgentDrawer } from "@/components/dashboard/agent-drawer";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { SiteTable, type SiteRecord } from "@/components/sites/site-table";
import { SiteFormDialog } from "@/components/sites/site-form-dialog";
import { getInitialFilter } from "@/hooks/use-table-filter";

export default function SitesListPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Filter States
  const [searchName, setSearchName] = useState(() => getInitialFilter("name"));
  const [filterKbStatus, setFilterKbStatus] = useState(() =>
    getInitialFilter("knowledgeBaseStatus"),
  );

  // Drawer States
  const [docSiteId, setDocSiteId] = useState<string | null>(null);
  const [docSiteName, setDocSiteName] = useState<string>("");
  const [agentSiteId, setAgentSiteId] = useState<string | null>(null);
  const [agentSiteName, setAgentSiteName] = useState<string>("");

  const {
    tableQuery,
    currentPage,
    setCurrentPage,
    pageCount,
    setFilters,
    setSorters,
  } = useTable({
    resource: "sites",
    pagination: { pageSize: 10 },
    syncWithLocation: true,
  });

  const { mutate: deleteSite, mutation: deleteMutation } = useDelete();
  const isDeleting = deleteMutation?.isPending;
  const sites = (tableQuery?.data?.data as unknown as SiteRecord[]) || [];

  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role?.toUpperCase() === "SUPER_ADMIN";

  const { options: orgOptions } = useSelect({
    resource: "organizations",
    optionLabel: "name",
    optionValue: "id",
    queryOptions: {
      enabled: isSuperAdmin,
    },
  });

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const filters: {
        field: string;
        operator: "contains" | "eq";
        value: string;
      }[] = [];
      if (searchName) {
        filters.push({
          field: "name",
          operator: "contains",
          value: searchName,
        });
      }
      if (filterKbStatus) {
        filters.push({
          field: "knowledgeBaseStatus",
          operator: "eq",
          value: filterKbStatus,
        });
      }
      setFilters(filters);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchName, filterKbStatus, setFilters, setCurrentPage]);

  const handleOpenCreate = () => {
    setEditId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    setEditId(id);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteSite(
        { resource: "sites", id: deleteId },
        { onSuccess: () => setDeleteId(null) },
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Website Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Total: {tableQuery?.data?.total || 0} websites
          </p>
        </div>
        <CanAccess action="create" resource="sites" fallback={null}>
          <Button
            className="gap-2 self-start sm:self-auto"
            onClick={handleOpenCreate}
          >
            <Plus className="size-4" /> Add New Site
          </Button>
        </CanAccess>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search website name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-56"
        />
        <select
          value={filterKbStatus}
          onChange={(e) => setFilterKbStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none shadow-xs"
        >
          <option value="">All KB Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
        </select>
        <select
          onChange={(e) => {
            if (!e.target.value) {
              setSorters([]);
            } else {
              const [field, order] = e.target.value.split("-");
              setSorters([{ field, order: order as "asc" | "desc" }]);
            }
          }}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none shadow-xs"
        >
          <option value="">Default sort</option>
          <option value="createdAt-desc">Newest first</option>
          <option value="createdAt-asc">Oldest first</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
        </select>

        {(searchName || filterKbStatus) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchName("");
              setFilterKbStatus("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Sites Table */}
      <SiteTable
        sites={sites}
        isLoading={tableQuery.isLoading}
        onOpenDocuments={(id, name) => {
          setDocSiteId(id);
          setDocSiteName(name);
        }}
        onOpenAgents={(id, name) => {
          setAgentSiteId(id);
          setAgentSiteName(name);
        }}
        onEdit={handleOpenEdit}
        onDelete={(id) => setDeleteId(id)}
      />

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        pageCount={pageCount}
        onPageChange={setCurrentPage}
      />

      {/* Create / Edit Modal */}
      <SiteFormDialog
        isOpen={isModalOpen}
        editId={editId}
        orgOptions={orgOptions as { label: string; value: string | number }[]}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => tableQuery.refetch()}
      />

      {/* Document Drawer */}
      {docSiteId && (
        <DocumentDrawer
          siteId={docSiteId}
          siteName={docSiteName}
          onClose={() => {
            setDocSiteId(null);
            tableQuery.refetch();
          }}
        />
      )}

      {/* Agent Drawer */}
      {agentSiteId && (
        <AgentDrawer
          siteId={agentSiteId}
          siteName={agentSiteName}
          onClose={() => {
            setAgentSiteId(null);
            tableQuery.refetch();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        isLoading={isDeleting}
        title="Delete Site"
        description="Are you sure you want to delete this website? This action cannot be undone and associated documents will be deleted."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
