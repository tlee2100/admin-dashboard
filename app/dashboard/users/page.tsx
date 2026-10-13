"use client";

import { useTable, useDelete, useSelect, useCan } from "@refinedev/core";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserTable, type UserRecord } from "@/components/users/user-table";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { getInitialFilter } from "@/hooks/use-table-filter";

export default function UsersListPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const { data: canAccess, isLoading: canAccessLoading } = useCan({
    resource: "users",
    action: "list",
  });

  useEffect(() => {
    if (!canAccessLoading && canAccess?.can === false) {
      toast.error(
        canAccess?.reason ||
          "You do not have permission to access User Management.",
      );
      router.replace("/dashboard");
    }
  }, [canAccess, canAccessLoading, router]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Filters
  const [searchName, setSearchName] = useState(() => getInitialFilter("name"));
  const [searchEmail, setSearchEmail] = useState(() =>
    getInitialFilter("email"),
  );
  const [searchRole, setSearchRole] = useState(() => getInitialFilter("role"));
  const [debouncedName, setDebouncedName] = useState(searchName);
  const [debouncedEmail, setDebouncedEmail] = useState(searchEmail);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(searchName);
      setDebouncedEmail(searchEmail);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchName, searchEmail]);

  const { tableQuery, currentPage, setCurrentPage, pageCount, setFilters } =
    useTable({
      resource: "users",
      pagination: { pageSize: 10 },
      syncWithLocation: true,
    });

  const { mutate: deleteUser, mutation: deleteMutation } = useDelete();
  const isDeleting = deleteMutation?.isPending;
  const users = (tableQuery?.data?.data as unknown as UserRecord[]) || [];

  const isSuperAdmin = session?.user?.role?.toUpperCase() === "SUPER_ADMIN";

  const { options: orgOptions } = useSelect({
    resource: "organizations",
    optionLabel: "name",
    optionValue: "id",
    queryOptions: {
      enabled: isSuperAdmin,
    },
  });

  const { options: siteOptions } = useSelect({
    resource: "sites",
    optionLabel: "name",
    optionValue: "id",
    queryOptions: {
      enabled: isSuperAdmin || session?.user?.role?.toUpperCase() === "ADMIN",
    },
  });

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const filters: {
      field: string;
      operator: "contains" | "eq";
      value: string;
    }[] = [];
    if (debouncedName) {
      filters.push({
        field: "name",
        operator: "contains",
        value: debouncedName,
      });
    }
    if (debouncedEmail) {
      filters.push({
        field: "email",
        operator: "contains",
        value: debouncedEmail,
      });
    }
    if (searchRole) {
      filters.push({
        field: "role",
        operator: "eq",
        value: searchRole,
      });
    }

    setFilters(filters);
    setCurrentPage(1);
  }, [debouncedName, debouncedEmail, searchRole, setFilters, setCurrentPage]);

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
      deleteUser(
        { resource: "users", id: deleteId },
        { onSuccess: () => setDeleteId(null) },
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage system users, agents, and permissions
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="size-4" /> Add User
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <Input
          placeholder="Filter by name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Input
          placeholder="Filter by email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <select
          value={searchRole}
          onChange={(e) => setSearchRole(e.target.value)}
          className="w-full sm:w-40 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="AGENT">Agent</option>
        </select>
      </div>

      {/* User Table */}
      <UserTable
        users={users}
        isLoading={tableQuery.isLoading}
        currentUserId={session?.user?.id}
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
      <UserFormDialog
        isOpen={isModalOpen}
        editId={editId}
        orgOptions={orgOptions as { label: string; value: string | number }[]}
        siteOptions={siteOptions as { label: string; value: string | number }[]}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => tableQuery.refetch()}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        isLoading={isDeleting}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
