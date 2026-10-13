"use client";

import { useTable, useDelete, useCan } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Building2 } from "lucide-react";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function OrganizationListPage() {
  const { status } = useSession();
  const router = useRouter();

  const { data: canAccess, isLoading: canAccessLoading } = useCan({
    resource: "organizations",
    action: "list",
  });

  useEffect(() => {
    if (!canAccessLoading && canAccess?.can === false) {
      toast.error(
        canAccess?.reason ||
          "You do not have permission to access Organizations.",
      );
      router.replace("/dashboard");
    }
  }, [canAccess, canAccessLoading, router]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { tableQuery, currentPage, setCurrentPage, pageCount } = useTable({
    resource: "organizations",
    pagination: { pageSize: 10 },
  });

  const { mutate: deleteOrg, mutation: deleteMutation } = useDelete();
  const isDeleting = deleteMutation?.isPending;

  type OrgRecord = { id: string; name: string; slug: string };
  const organizations =
    (tableQuery?.data?.data as unknown as OrgRecord[]) || [];

  // Form setup for Create / Edit
  const {
    refineCore: { onFinish, formLoading, query },
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    refineCoreProps: {
      resource: "organizations",
      action: editId ? "edit" : "create",
      id: editId ?? undefined,
      onMutationSuccess: () => {
        handleCloseModal();
      },
    },
  });

  // Auto-fill when editing
  useEffect(() => {
    if (editId && query?.data?.data) {
      const org = query.data.data as { name: string; slug: string };
      reset({ name: org.name, slug: org.slug });
    }
  }, [editId, query?.data?.data, reset]);

  // Auto-generate slug from name (only when creating)
  const nameValue = watch("name");
  useEffect(() => {
    if (!editId && nameValue) {
      const slug = nameValue
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setValue("slug", slug);
    }
  }, [nameValue, editId, setValue]);

  const handleOpenCreate = () => {
    setEditId(null);
    reset({ name: "", slug: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    setEditId(id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setEditId(null);
      reset({ name: "", slug: "" });
    }, 200);
  };

  const handleDelete = (id: string) => {
    deleteOrg(
      { resource: "organizations", id },
      { onSuccess: () => setDeleteId(null) },
    );
  };

  if (
    status === "loading" ||
    canAccessLoading ||
    (status === "authenticated" && canAccess?.can === false)
  ) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Checking permissions...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organization Management</h1>
          <p className="text-sm text-muted-foreground">
            Total: {tableQuery?.data?.total || 0} organizations
          </p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Add New
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Organization Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableQuery?.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading data...
                </TableCell>
              </TableRow>
            ) : organizations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="size-8 opacity-30" />
                    <span>No organizations found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {org.slug}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleOpenEdit(org.id)}
                      >
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setDeleteId(org.id)}
                      >
                        <Trash2 className="size-3.5" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        pageCount={pageCount}
        onPageChange={setCurrentPage}
      />

      {/* Create / Edit Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Organization" : "Add New Organization"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onFinish)}
            className="flex flex-col gap-4 mt-2"
          >
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Organization Name <span className="text-destructive">*</span>
              </label>
              <Input
                {...register("name", {
                  required: "Organization name cannot be empty",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters",
                  },
                })}
                placeholder="e.g. VTI Group"
              />
              {errors.name && (
                <span className="text-xs text-destructive">
                  {errors.name.message as string}
                </span>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Slug <span className="text-destructive">*</span>
              </label>
              <Input
                {...register("slug", {
                  required: "Slug cannot be empty",
                  pattern: {
                    value: /^[a-z0-9-]+$/,
                    message:
                      "Slug can only contain lowercase letters, numbers and hyphens (-)",
                  },
                })}
                placeholder="e.g. vti-group"
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from name. Only lowercase letters, numbers, and
                hyphens.
              </p>
              {errors.slug && (
                <span className="text-xs text-destructive">
                  {errors.slug.message as string}
                </span>
              )}
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading
                  ? "Saving..."
                  : editId
                    ? "Save changes"
                    : "Create Organization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        isLoading={isDeleting}
        title="Delete Organization"
        description="Are you sure you want to delete this organization? This action cannot be undone."
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
