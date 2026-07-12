"use client";

import { useTable, useDelete } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
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
  type UserRecord = { id: string; name: string; email: string; role: string };
  const users = (tableQuery?.data?.data as unknown as UserRecord[]) || [];

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

  // Tự động điền dữ liệu khi đang ở chế độ Edit và load xong
  useEffect(() => {
    if (editId && query?.data?.data) {
      const user = query.data.data as {
        name: string;
        email: string;
        role: string;
      };
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        password: "", // không hiện password cũ
      });
    }
  }, [editId, query?.data?.data, reset]);

  // (Debounce) cho bộ lọc
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters([
        { field: "name", operator: "eq", value: searchName },
        { field: "email", operator: "eq", value: searchEmail },
        { field: "role", operator: "eq", value: searchRole },
      ]);
      setCurrentPage(1); // Reset về trang 1 khi lọc thay đổi
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchName, searchEmail, searchRole, setFilters, setCurrentPage]);

  const handleOpenCreate = () => {
    setEditId(null);
    reset({ name: "", email: "", password: "", role: "user" });
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
      reset({ name: "", email: "", password: "", role: "user" });
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Người dùng</h1>
          <p className="text-sm text-muted-foreground">
            Tổng số: {tableQuery?.data?.total || 0} thành viên
          </p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Thêm mới
        </Button>
      </div>

      {/* Bộ lọc (Filters) */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Tìm theo tên..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-48"
        />
        <Input
          placeholder="Tìm theo email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="w-48"
        />
        <select
          value={searchRole}
          onChange={(e) => setSearchRole(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-900"
        >
          <option value="">Tất cả quyền hạn</option>
          <option value="admin">Admin</option>
          <option value="agent">Agent</option>
        </select>

        {(searchName || searchEmail || searchRole) && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Bảng danh sách */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Quyền hạn</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableQuery?.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  Không tìm thấy người dùng nào
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
                        <Pencil className="size-3.5" /> Sửa
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setDeleteId(user.id)}
                      >
                        <Trash2 className="size-3.5" /> Xóa
                      </Button>
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
          Trang {currentPage} / {pageCount}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={(currentPage ?? 1) <= 1}
            onClick={() => setCurrentPage((currentPage ?? 1) - 1)}
            className="gap-1"
          >
            <ChevronLeft className="size-4" /> Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={(currentPage ?? 1) >= (pageCount ?? 1)}
            onClick={() => setCurrentPage((currentPage ?? 1) + 1)}
            className="gap-1"
          >
            Tiếp <ChevronRight className="size-4" />
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
            <DialogTitle>
              {editId ? "Chỉnh sửa Người dùng" : "Thêm Người dùng mới"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onFinish)}
            className="flex flex-col gap-4 mt-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Họ và Tên</label>
              <Input
                {...register("name", { required: "Vui lòng nhập họ và tên" })}
                placeholder="Ví dụ: Nguyễn Văn A"
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
                  required: "Vui lòng nhập email",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email không hợp lệ",
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
                          return "Email này đã được sử dụng";
                        }
                      }
                    } catch (err) {
                      console.error("Lỗi kiểm tra email:", err);
                    }
                    return true;
                  },
                })}
                placeholder="Ví dụ: email@domain.com"
              />
              {errors.email && (
                <span className="text-xs text-destructive">
                  {errors.email.message as string}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {editId ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"}
              </label>
              <Input
                type="password"
                {...register("password", {
                  required: editId ? false : "Vui lòng nhập mật khẩu",
                  minLength: {
                    value: 6,
                    message: "Mật khẩu phải dài ít nhất 6 ký tự",
                  },
                })}
                placeholder="Nhập ít nhất 6 ký tự"
              />
              {errors.password && (
                <span className="text-xs text-destructive">
                  {errors.password.message as string}
                </span>
              )}
            </div>

            {editId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Quyền hạn</label>
                <select
                  {...register("role")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={formLoading || (editId ? query?.isLoading : false)}
              >
                {formLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-background rounded-xl p-6 shadow-xl w-[340px] flex flex-col gap-4">
            <h3 className="font-semibold text-lg">Xác nhận xóa</h3>
            <p className="text-sm text-muted-foreground">
              Bạn có chắc chắn muốn xóa thành viên này không? Hành động này
              không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Hủy
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={() => handleDelete(deleteId)}
              >
                {isDeleting ? "Đang xóa..." : "Xóa"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
