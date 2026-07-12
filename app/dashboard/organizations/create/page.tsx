"use client";

import { useForm } from "@refinedev/react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateOrganizationPage() {
  const router = useRouter();

  const {
    refineCore: { onFinish, formLoading },
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    refineCoreProps: {
      resource: "organizations",
      action: "create",
      onMutationSuccess: () => {
        router.push("/dashboard/organizations"); // Sau khi tạo thành công → về danh sách
      },
    },
  });

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/organizations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Thêm Tổ chức mới</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onFinish)} className="flex flex-col gap-4">
        {/* Trường Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Tên tổ chức <span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Nhập tên tổ chức..."
            {...register("name", {
              required: "Tên tổ chức không được để trống",
              minLength: { value: 2, message: "Tên phải có ít nhất 2 ký tự" },
            })}
          />
          {/* Hiển thị lỗi validation */}
          {errors.name && (
            <p className="text-xs text-destructive">
              {errors.name.message as string}
            </p>
          )}
        </div>

        {/* Trường Description (ví dụ thêm field) */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium">
            Mô tả
          </label>
          <textarea
            id="description"
            rows={3}
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Mô tả ngắn về tổ chức..."
            {...register("description")}
          />
        </div>

        {/* Nút Submit */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={formLoading}>
            {formLoading ? "Đang lưu..." : "Tạo tổ chức"}
          </Button>
          <Link href="/dashboard/organizations">
            <Button variant="outline" type="button">
              Hủy
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
