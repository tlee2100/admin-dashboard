"use client";

import { useTable, useDelete, CanAccess, useSelect } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Globe,
  FileText,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentDrawer } from "@/components/dashboard/document-drawer";
import { AgentDrawer } from "@/components/dashboard/agent-drawer";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function SitesListPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // States cho Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  //States cho Filter
  const [searchName, setSearchName] = useState("");
  const [filterKbStatus, setFilterKbStatus] = useState("");

  // States cho Document Drawer
  const [docSiteId, setDocSiteId] = useState<string | null>(null);
  const [docSiteName, setDocSiteName] = useState<string>("");

  // States cho Agent Drawer
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
  type SiteRecord = {
    id: string;
    name: string;
    url: string;
    organization?: { id: number; name: string };
    knowledgeBaseStatus?: string;
  };
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
  // Form setup cho Create / Edit
  const {
    refineCore: { onFinish, formLoading, query },
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    refineCoreProps: {
      resource: "sites",
      action: editId ? "edit" : "create",
      id: editId ?? undefined,
      onMutationSuccess: () => {
        handleCloseModal();
      },
    },
  });

  const handleCustomSubmit = (data: Record<string, unknown>) => {
    const payload = { ...data };
    if (payload.organizationId === "") {
      delete payload.organizationId;
    }
    onFinish(payload);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters([
        { field: "name", operator: "contains", value: searchName },
        { field: "knowledgeBaseStatus", operator: "eq", value: filterKbStatus },
      ]);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchName, filterKbStatus, setFilters, setCurrentPage]);

  // Tự động điền dữ liệu khi đang ở chế độ Edit và load xong
  useEffect(() => {
    if (editId && query?.data?.data) {
      const site = query.data.data as {
        name: string;
        url: string;
        organizationId?: number;
      };
      reset({
        name: site.name,
        url: site.url,
        organizationId: site.organizationId || "",
      });
    }
  }, [editId, query?.data?.data, reset]);

  const handleOpenCreate = () => {
    setEditId(null);
    reset({ name: "", url: "", organizationId: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    setEditId(id);
    // Dữ liệu sẽ tự load qua queryResult của useForm
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setEditId(null);
      reset({ name: "", url: "", organizationId: "" });
    }, 200); // delay để tránh giật UI khi modal đang đóng
  };

  const handleDelete = (id: string) => {
    deleteSite(
      { resource: "sites", id },
      {
        onSuccess: () => setDeleteId(null),
      },
    );
  };

  const getKbStatusBadge = (status?: string) => {
    const s = status?.toUpperCase() || "PENDING";
    switch (s) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-yellow-600 bg-yellow-50">
            Pending
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge variant="outline" className="text-blue-600 bg-blue-50">
            <Loader2 className="mr-1 size-3 animate-spin" /> Processing
          </Badge>
        );
      case "READY":
        return (
          <Badge variant="outline" className="text-green-600 bg-green-50">
            <CheckCircle className="mr-1 size-3" /> Ready
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="outline" className="text-red-600 bg-red-50">
            <AlertCircle className="mr-1 size-3" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600 bg-gray-50">
            {status || "None"}
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sites Management</h1>
          <p className="text-sm text-muted-foreground">
            Total: {tableQuery?.data?.total || 0} websites
          </p>
        </div>
        <CanAccess action="create" resource="sites" fallback={null}>
          <Button className="gap-2" onClick={handleOpenCreate}>
            <Plus className="size-4" />
            Add New Site
          </Button>
        </CanAccess>
      </div>

      {/* Bộ lọc (Filters) */}
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
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none"
        >
          <option value="">All KB Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
        </select>
        {/* Sort button */}
        <select
          onChange={(e) => {
            if (!e.target.value) {
              setSorters([]);
            } else {
              const [field, order] = e.target.value.split("-");
              setSorters([{ field, order: order as "asc" | "desc" }]);
            }
          }}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none"
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

      {/* Bảng danh sách */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Website Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>KB Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableQuery?.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading data...
                </TableCell>
              </TableRow>
            ) : sites.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No websites found
                </TableCell>
              </TableRow>
            ) : (
              sites.map((site) => (
                <TableRow
                  key={site.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium">{site.name}</TableCell>
                  <TableCell>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-blue-500 hover:underline"
                    >
                      <Globe className="size-3.5" />
                      {site.url}
                    </a>
                  </TableCell>
                  <TableCell>
                    {site.organization?.name ? (
                      <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 font-normal">
                        {site.organization.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">
                        None
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getKbStatusBadge(site.knowledgeBaseStatus)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setDocSiteId(site.id);
                          setDocSiteName(site.name);
                        }}
                      >
                        <FileText className="size-3.5" /> Documents
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setAgentSiteId(site.id);
                          setAgentSiteName(site.name);
                        }}
                      >
                        <Users className="size-3.5" /> Agents
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() =>
                          window.open(
                            `http://localhost:3001/test-chat/${site.id}`,
                            "_blank",
                          )
                        }
                      >
                        <MessageSquare className="size-3.5" /> Test-Chatting
                      </Button>
                      <CanAccess action="edit" resource="sites" fallback={null}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleOpenEdit(site.id)}
                        >
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                      </CanAccess>
                      <CanAccess
                        action="delete"
                        resource="sites"
                        fallback={null}
                      >
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setDeleteId(site.id)}
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </Button>
                      </CanAccess>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Phân trang */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {currentPage} / {pageCount}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={(currentPage ?? 1) <= 1}
            onClick={() => setCurrentPage((currentPage ?? 1) - 1)}
            className="gap-1"
          >
            <ChevronLeft className="size-4" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={(currentPage ?? 1) >= (pageCount ?? 1)}
            onClick={() => setCurrentPage((currentPage ?? 1) + 1)}
            className="gap-1"
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Form Modal (Create / Edit) */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Site" : "Add New Site"}</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(handleCustomSubmit)}
            className="flex flex-col gap-4 mt-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Website Name</label>
              <Input
                {...register("name", {
                  required: "Please enter a website name",
                })}
                placeholder="e.g. My Awesome Site"
              />
              {errors.name && (
                <span className="text-xs text-destructive">
                  {errors.name.message as string}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">URL Path</label>
              <Input
                type="url"
                {...register("url", {
                  required: "Please enter a URL path",
                  pattern: {
                    value:
                      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                    message: "Invalid URL (e.g. https://example.com)",
                  },
                })}
                placeholder="e.g. https://www.example.com"
              />
              {errors.url && (
                <span className="text-xs text-destructive">
                  {errors.url.message as string}
                </span>
              )}
            </div>

            {isSuperAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization</label>
                <select
                  {...register("organizationId", {
                    setValueAs: (v) => (v === "" ? null : Number(v)),
                  })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">None (Standalone)</option>
                  {orgOptions.map((org) => (
                    <option key={org.value} value={org.value}>
                      {org.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formLoading || (editId ? query?.isLoading : false)}
              >
                {formLoading ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-background rounded-xl p-6 shadow-xl w-[340px] flex flex-col gap-4">
            <h3 className="font-semibold text-lg">Confirm Deletion</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this website? This action cannot
              be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={() => handleDelete(deleteId)}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document Drawer */}
      <DocumentDrawer
        siteId={docSiteId}
        siteName={docSiteName}
        onClose={() => setDocSiteId(null)}
      />

      {/* Agent Drawer */}
      <AgentDrawer
        siteId={agentSiteId}
        siteName={agentSiteName}
        onClose={() => setAgentSiteId(null)}
      />
    </div>
  );
}
