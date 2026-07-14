"use client";

import { useTable, useDelete, useSelect } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export default function UsersListPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user?.role?.toUpperCase() === "AGENT"
    ) {
      toast.error("You do not have permission to access User Management.");
      window.location.href = "/dashboard";
    }
  }, [session, status]);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // States cho Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Lưu state input tìm kiếm cục bộ trước khi trigger lọc
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchRole, setSearchRole] = useState("");

  const { tableQuery, currentPage, setCurrentPage, pageCount, setFilters } =
    useTable({
      resource: "users",
      pagination: { pageSize: 10 },
    });

  const { mutate: deleteUser, mutation: deleteMutation } = useDelete();
  const isDeleting = deleteMutation?.isPending;
  type UserRecord = {
    id: string;
    name: string;
    email: string;
    role: string;
    organization?: { id: number; name: string };
  };
  const users = (tableQuery?.data?.data as unknown as UserRecord[]) || [];

  const isSuperAdmin = session?.user?.role?.toUpperCase() === "SUPER_ADMIN";

  const { options: orgOptions } = useSelect({
    resource: "organizations",
    optionLabel: "name",
    optionValue: "id",
    queryOptions: {
      enabled: isSuperAdmin, // Only fetch orgs if superadmin
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
      resource: "users",
      action: editId ? "edit" : "create",
      id: editId ?? undefined,
      onMutationSuccess: () => {
        handleCloseModal();
      },
    },
  });

  const handleCustomSubmit = (data: Record<string, unknown>) => {
    const payload = { ...data };
    if (payload.password === "") {
      delete payload.password;
    }
    if (payload.organizationId === "") {
      delete payload.organizationId;
    }
    delete payload.role;
    onFinish(payload);
  };

  // Tự động điền dữ liệu khi đang ở chế độ Edit và load xong
  useEffect(() => {
    if (editId && query?.data?.data) {
      const user = query.data.data as {
        name: string;
        email: string;
        role: string;
        organizationId?: number;
      };
      reset({
        name: user.name,
        email: user.email,
        organizationId: user.organizationId || "",
        password: "", // không hiện password cũ
      });
    }
  }, [editId, query?.data?.data, reset]);

  const [debouncedName, setDebouncedName] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");

  // Debounce text inputs (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(searchName);
      setDebouncedEmail(searchEmail);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchName, searchEmail]);

  // Apply filters instantly when debounced text OR searchRole changes
  useEffect(() => {
    setFilters([
      { field: "name", operator: "eq", value: debouncedName },
      { field: "email", operator: "eq", value: debouncedEmail },
      { field: "role", operator: "eq", value: searchRole },
    ]);
    setCurrentPage(1); // Reset về trang 1 khi lọc thay đổi
  }, [debouncedName, debouncedEmail, searchRole, setFilters, setCurrentPage]);

  const handleOpenCreate = () => {
    setEditId(null);
    reset({
      name: "",
      email: "",
      password: "",
      organizationId: "",
    });
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
      reset({
        name: "",
        email: "",
        password: "",
        role: "agent",
        organizationId: "",
      });
    }, 200); // delay để tránh giật UI khi modal đang đóng
  };

  const handleDelete = (id: string) => {
    deleteUser(
      { resource: "users", id },
      {
        onSuccess: () => setDeleteId(null),
      },
    );
  };

  const handleClearFilters = () => {
    setSearchName("");
    setSearchEmail("");
    setSearchRole("");
  };

  if (
    status === "loading" ||
    (status === "authenticated" &&
      session?.user?.role?.toUpperCase() === "AGENT")
  ) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Checking permissions...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Total: {tableQuery?.data?.total || 0} members
          </p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Add New
        </Button>
      </div>

      {/* Bộ lọc (Filters) */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-48"
        />
        <Input
          placeholder="Search by email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="w-48"
        />
        <select
          value={searchRole}
          onChange={(e) => setSearchRole(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-900"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="agent">Agent</option>
        </select>

        {(searchName || searchEmail || searchRole) && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Bảng danh sách */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Role</TableHead>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.organization?.name ? (
                      <Badge variant="secondary" className="font-normal">
                        {user.organization.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">
                        None
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleOpenEdit(user.id)}
                      >
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                      {String(user.id) !== String(session?.user?.id) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setDeleteId(user.id)}
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </Button>
                      )}
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
            <DialogTitle>{editId ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(handleCustomSubmit)}
            className="flex flex-col gap-4 mt-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                {...register("name", {
                  required: "Please enter your full name",
                })}
                placeholder="e.g. John Smith"
              />
              {errors.name && (
                <span className="text-xs text-destructive">
                  {errors.name.message as string}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                {...register("email", {
                  required: "Please enter an email address",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                  validate: async (value) => {
                    if (!value) return true;
                    try {
                      const apiUrl =
                        process.env.NEXT_PUBLIC_API_URL ||
                        "http://localhost:3000";
                      const res = await fetch(
                        `${apiUrl}/users?email=${encodeURIComponent(value)}&limit=1`,
                        {
                          headers: {
                            Authorization: `Bearer ${(session as { accessToken?: string })?.accessToken}`,
                          },
                        },
                      );
                      if (res.ok) {
                        const data = await res.json();
                        if (data && data.total > 0) {
                          const userFound = data.data[0];
                          if (editId && userFound.id === Number(editId)) {
                            return true;
                          }
                          return "This email is already in use";
                        }
                      }
                    } catch (err) {
                      console.error("Email check error:", err);
                    }
                    return true;
                  },
                })}
                placeholder="e.g. email@domain.com"
              />
              {errors.email && (
                <span className="text-xs text-destructive">
                  {errors.email.message as string}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {editId
                  ? "New Password (Leave blank to keep current)"
                  : "Password"}
              </label>
              <Input
                type="password"
                {...register("password", {
                  required: editId ? false : "Please enter a password",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                placeholder="Enter at least 6 characters"
              />
              {errors.password && (
                <span className="text-xs text-destructive">
                  {errors.password.message as string}
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
              Are you sure you want to delete this member? This action cannot be
              undone.
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
    </div>
  );
}
