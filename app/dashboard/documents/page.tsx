"use client";

import { useTable, useDelete, CanAccess, useSelect } from "@refinedev/core";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { DocumentDrawer } from "@/components/dashboard/document-drawer";

export default function DocumentsListPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // States cho Upload Modal/Drawer
  const [isSiteSelectOpen, setIsSiteSelectOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [activeDrawerSiteId, setActiveDrawerSiteId] = useState<string | null>(
    null,
  );

  // States cho Filter
  const [searchName, setSearchName] = useState("");
  const [filterSiteId, setFilterSiteId] = useState("");
  const [debouncedName, setDebouncedName] = useState("");

  const { data: session } = useSession();
  const role = session?.user?.role?.toUpperCase();
  const isAdminOrSuper = role === "ADMIN" || role === "SUPER_ADMIN";

  const {
    tableQuery,
    currentPage,
    setCurrentPage,
    pageCount,
    setFilters,
    setSorters,
  } = useTable({
    resource: "documents",
    pagination: { pageSize: 10 },
    syncWithLocation: true,
  });

  const { mutate: deleteDocument, mutation: deleteMutation } = useDelete();
  const isDeleting = deleteMutation?.isPending;

  // Lấy danh sách Sites (chỉ hiển thị những site user có quyền)
  const { options: siteOptions } = useSelect({
    resource: "sites",
    optionLabel: "name",
    optionValue: "id",
  });

  // No longer using useCustomMutation here since DocumentDrawer handles it

  type DocumentRecord = {
    id: string;
    filename: string;
    status: string;
    uploadedAt: string;
    site?: { id: number; name: string };
  };
  const documents =
    (tableQuery?.data?.data as unknown as DocumentRecord[]) || [];

  // Debounce text inputs (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(searchName);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchName]);

  // Apply filters instantly when debounced text OR filterSiteId changes
  useEffect(() => {
    setFilters([
      { field: "filename", operator: "contains", value: debouncedName },
      { field: "siteId", operator: "eq", value: filterSiteId },
    ]);
    setCurrentPage(1); // Reset về trang 1 khi lọc thay đổi
  }, [debouncedName, filterSiteId, setFilters, setCurrentPage]);

  const handleOpenSiteSelect = () => {
    setSelectedSiteId("");
    setIsSiteSelectOpen(true);
  };

  const handleContinueToDrawer = () => {
    if (!selectedSiteId) {
      toast.error("Please select a site!");
      return;
    }
    setIsSiteSelectOpen(false);
    setActiveDrawerSiteId(selectedSiteId);
  };

  const handleCloseDrawer = () => {
    setActiveDrawerSiteId(null);
    tableQuery?.refetch();
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteDocument(
        {
          resource: "documents",
          id: deleteId,
        },
        {
          onSuccess: () => {
            setDeleteId(null);
          },
        },
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md text-xs font-medium">
            Pending
          </span>
        );
      case "processing":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-xs font-medium">
            Processing
          </span>
        );
      case "ready":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-md text-xs font-medium">
            Ready
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-md text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Document Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total: {tableQuery?.data?.total || 0} documents
          </p>
        </div>
        <CanAccess action="create" resource="documents">
          <Button onClick={handleOpenSiteSelect} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </CanAccess>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-center">
        {/* Search */}
        <Input
          placeholder="Search by filename..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-56"
        />

        {/* Filter by Site */}
        <select
          value={filterSiteId}
          onChange={(e) => setFilterSiteId(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none"
        >
          <option value="">All Sites</option>
          {siteOptions?.map((site) => (
            <option key={site.value} value={site.value}>
              {site.label}
            </option>
          ))}
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
          <option value="">Default sorting (Newest first)</option>
          <option value="uploadedAt-desc">Newest first</option>
          <option value="uploadedAt-asc">Oldest first</option>
          <option value="filename-asc">Name (A-Z)</option>
          <option value="filename-desc">Name (Z-A)</option>
        </select>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Filename</TableHead>
              <TableHead>KB Status</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading data...
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      {doc.filename}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell>{doc.site?.name || "N/A"}</TableCell>
                  <TableCell>
                    {new Date(doc.uploadedAt).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <CanAccess action="delete" resource="documents">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(doc.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, pageCount))
              }
              disabled={currentPage === pageCount}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isSiteSelectOpen} onOpenChange={setIsSiteSelectOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Site to Manage Documents</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Site</label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none"
              >
                <option value="" disabled>
                  -- Select a Site --
                </option>
                {siteOptions?.map((site) => (
                  <option key={site.value} value={site.value}>
                    {site.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSiteSelectOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleContinueToDrawer}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Drawer for Upload/Manage */}
      {activeDrawerSiteId && (
        <DocumentDrawer
          siteId={activeDrawerSiteId}
          siteName={
            siteOptions?.find((s) => String(s.value) === activeDrawerSiteId)
              ?.label || ""
          }
          onClose={handleCloseDrawer}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this document? This action cannot be
            undone and data will be permanently lost.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
