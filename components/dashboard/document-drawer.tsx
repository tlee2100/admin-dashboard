"use client";

import { useTable, useDelete } from "@refinedev/core";
import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDropzone } from "react-dropzone";
import { useNotificationsStore } from "@/lib/store/notifications-store";
import {
  FileText,
  Trash2,
  UploadCloud,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DocumentDrawerProps {
  siteId: string | null;
  siteName?: string;
  onClose: () => void;
}

export function DocumentDrawer({
  siteId,
  siteName,
  onClose,
}: DocumentDrawerProps) {
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const { tableQuery } = useTable({
    resource: "documents",
    pagination: { mode: "off" },
    filters: {
      permanent: [
        {
          field: "siteId",
          operator: "eq",
          value: siteId,
        },
      ],
    },
    queryOptions: {
      enabled: !!siteId,
    },
  });

  const { mutate: deleteDoc, mutation } = useDelete();
  const isDeleting = mutation?.isPending;

  const documents =
    (tableQuery?.data?.data as {
      id: string;
      filename: string;
      status: string;
    }[]) || [];
  const notifications = useNotificationsStore((s) => s.notifications);

  useEffect(() => {
    const latest = notifications[0];
    if (
      latest &&
      (latest.type === "document.processing" ||
        latest.type === "document.ready")
    ) {
      tableQuery.refetch();
    }
  }, [notifications, tableQuery]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setStagedFiles((prev) => [...prev, ...acceptedFiles]);
    setUploadError(null);
  }, []);

  const removeStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!siteId || stagedFiles.length === 0) return;
    setUploadError(null);
    setIsUploading(true);

    for (const file of stagedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("siteId", siteId);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/documents/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${(session as { accessToken?: string })?.accessToken}`,
            },
            body: formData,
          },
        );
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Upload failed");
        }
      } catch (error: unknown) {
        setUploadError(error instanceof Error ? error.message : String(error));
        break; // stop on first error
      }
    }

    setIsUploading(false);
    if (!uploadError) {
      setStagedFiles([]);
    }
    tableQuery.refetch(); // reload data
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        "text/plain": [".txt"],
        "application/pdf": [".pdf"],
      },
      maxSize: 10 * 1024 * 1024, // 10MB
    });

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
      deleteDoc(
        {
          resource: "documents",
          id,
        },
        {
          onSuccess: () => tableQuery.refetch(),
        },
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-yellow-600 bg-yellow-50">
            <Loader2 className="mr-1 size-3 animate-spin" /> Đang xử lý
          </Badge>
        );
      case "READY":
        return (
          <Badge variant="outline" className="text-green-600 bg-green-50">
            <CheckCircle className="mr-1 size-3" /> Hoàn thành
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="outline" className="text-red-600 bg-red-50">
            <AlertCircle className="mr-1 size-3" /> Lỗi
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Sheet open={!!siteId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Quản lý tài liệu</SheetTitle>
          <SheetDescription>
            Tài liệu huấn luyện cho trang web:{" "}
            <span className="font-semibold text-foreground">{siteName}</span>
          </SheetDescription>
        </SheetHeader>

        {/* Upload Zone */}
        <div className="mb-8">
          <h3 className="text-sm font-medium mb-3">Tải lên tài liệu mới</h3>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p>Đang tải tài liệu lên...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <UploadCloud className="size-8 mb-2 text-muted-foreground/50" />
                <p className="font-medium text-foreground">
                  Kéo thả file vào đây, hoặc click để chọn file
                </p>
                <p className="text-sm">Hỗ trợ: PDF, TXT (Tối đa 10MB)</p>
              </div>
            )}
          </div>
          {fileRejections.length > 0 && (
            <p className="text-sm text-destructive mt-2 flex items-center gap-1">
              <AlertCircle className="size-4" />
              File không hợp lệ hoặc quá 10MB!
            </p>
          )}
          {uploadError && (
            <p className="text-sm text-destructive mt-2 flex items-center gap-1">
              <AlertCircle className="size-4" />
              Lỗi: {uploadError}
            </p>
          )}

          {/* Danh sách file đang chờ (Staging) */}
          {stagedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">
                File chờ tải lên ({stagedFiles.length})
              </h4>
              <ul className="space-y-2 mb-4">
                {stagedFiles.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-muted/50 p-2 rounded-md border text-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="size-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => removeStagedFile(index)}
                      disabled={isUploading}
                    >
                      <X className="size-3" />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleUpload}
                disabled={isUploading || stagedFiles.length === 0}
                className="w-full gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Đang tải lên...
                  </>
                ) : (
                  <>
                    <UploadCloud className="size-4" /> Xác nhận tải lên
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Document List */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center justify-between">
            <span>Danh sách tài liệu đã tải lên</span>
            <span className="text-muted-foreground font-normal text-xs">
              {documents.length} tài liệu
            </span>
          </h3>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Tên file</TableHead>
                  <TableHead className="w-[120px]">Trạng thái</TableHead>
                  <TableHead className="w-[70px] text-right">Xóa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableQuery?.isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-6 text-muted-foreground text-sm"
                    >
                      Đang tải danh sách...
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-6 text-muted-foreground text-sm"
                    >
                      Chưa có tài liệu nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell
                        className="font-medium text-sm flex items-center gap-2 truncate max-w-[200px]"
                        title={doc.filename}
                      >
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{doc.filename}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(doc.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
