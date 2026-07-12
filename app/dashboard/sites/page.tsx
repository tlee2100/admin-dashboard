"use client";

import { useTable, useDelete, CanAccess } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
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
} from "lucide-react";
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
  type SiteRecord = { id: string; name: string; url: string };
  const sites = (tableQuery?.data?.data as unknown as SiteRecord[]) || [];

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
      const site = query.data.data as { name: string; url: string };
      reset({
        name: site.name,
        url: site.url,
      });
    }
  }, [editId, query?.data?.data, reset]);

  const handleOpenCreate = () => {
    setEditId(null);
    reset({ name: "", url: "" });
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
      reset({ name: "", url: "" });
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Sites</h1>
          <p className="text-sm text-muted-foreground">
            Tổng số: {tableQuery?.data?.total || 0} trang web
          </p>
        </div>
        <CanAccess action="create" resource="sites" fallback={null}>
          <Button className="gap-2" onClick={handleOpenCreate}>
            <Plus className="size-4" />
            Thêm Site mới
          </Button>
        </CanAccess>
      </div>

      {/* Bộ lọc (Filters) */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Tìm tên trang web..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-56"
        />
        <select
          value={filterKbStatus}
          onChange={(e) => setFilterKbStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none"
        >
          <option value="">Tất cả Trạng thái KB</option>
          <option value="pending">Đang xử lý (Pending)</option>
          <option value="completed">Đã hoàn thành (Completed)</option>
          <option value="failed">Lỗi (Failed)</option>
        </select>
        {/* Nút Sắp xếp */}
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
          <option value="">Sắp xếp mặc định</option>
          <option value="createdAt-desc">Mới nhất trước</option>
          <option value="createdAt-asc">Cũ nhất trước</option>
          <option value="name-asc">Tên (A-Z)</option>
          <option value="name-desc">Tên (Z-A)</option>
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
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Bảng danh sách */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Tên trang web</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableQuery?.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground"
                >
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : sites.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground"
                >
                  Không tìm thấy trang web nào
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
                        <FileText className="size-3.5" /> Tài liệu
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
                        <Users className="size-3.5" /> Nhân viên
                      </Button>
                      <CanAccess action="edit" resource="sites" fallback={null}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleOpenEdit(site.id)}
                        >
                          <Pencil className="size-3.5" /> Sửa
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
                          <Trash2 className="size-3.5" /> Xóa
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
              {editId ? "Chỉnh sửa Site" : "Thêm Site mới"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onFinish)}
            className="flex flex-col gap-4 mt-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên trang web</label>
              <Input
                {...register("name", {
                  required: "Vui lòng nhập tên trang web",
                })}
                placeholder="Ví dụ: My Awesome Site"
              />
              {errors.name && (
                <span className="text-xs text-destructive">
                  {errors.name.message as string}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Đường dẫn URL</label>
              <Input
                type="url"
                {...register("url", {
                  required: "Vui lòng nhập đường dẫn URL",
                  pattern: {
                    value:
                      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                    message: "URL không hợp lệ (ví dụ: https://example.com)",
                  },
                })}
                placeholder="Ví dụ: https://www.example.com"
              />
              {errors.url && (
                <span className="text-xs text-destructive">
                  {errors.url.message as string}
                </span>
              )}
            </div>

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
              Bạn có chắc chắn muốn xóa trang web này không? Hành động này không
              thể hoàn tác.
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
