"use client";

import { useTable, useDelete } from "@refinedev/core";
import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrganizationListPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { tableQuery, currentPage, setCurrentPage, pageCount } = useTable({
    resource: "organizations",
    pagination: { pageSize: 10 },
  });

  const { mutate: deleteOrg, mutation } = useDelete();
  const isDeleting = mutation?.isPending;

  type OrgRecord = { id: string; name: string };
  const organizations =
    (tableQuery?.data?.data as unknown as OrgRecord[]) || [];

  const handleDelete = (id: string) => {
    deleteOrg(
      { resource: "organizations", id },
      {
        onSuccess: () => setDeleteId(null),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý Tổ chức</h1>
        <Link href="/dashboard/organizations/create">
          <Button className="gap-2">
            <Plus className="size-4" />
            Thêm mới
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">ID</th>
              <th className="text-left px-4 py-3 font-medium">Tên tổ chức</th>
              <th className="text-left px-4 py-3 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {tableQuery?.isLoading ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground"
                >
                  Đang tải...
                </td>
              </tr>
            ) : (
              organizations.map((org) => (
                <tr
                  key={org.id}
                  className="border-t hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">{org.id}</td>
                  <td className="px-4 py-3 font-medium">{org.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/organizations/edit/${org.id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Pencil className="size-3.5" /> Sửa
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setDeleteId(org.id)}
                      >
                        <Trash2 className="size-3.5" /> Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={(currentPage ?? 1) >= (pageCount ?? 1)}
            onClick={() => setCurrentPage((currentPage ?? 1) + 1)}
          >
            Tiếp
          </Button>
        </div>
      </div>

      {/* Modal xác nhận xóa */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-6 shadow-xl w-[340px] flex flex-col gap-4">
            <h3 className="font-semibold text-lg">Xác nhận xóa</h3>
            <p className="text-sm text-muted-foreground">
              Bạn có chắc muốn xóa tổ chức này không? Hành động này không thể
              hoàn tác.
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
