"use client";

import { useForm } from "@refinedev/react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function EditOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);

  const {
    refineCore: { onFinish, formLoading, query },
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    refineCoreProps: {
      resource: "organizations",
      action: "edit", // ← Khác với trang Create: action = "edit"
      id: id, // ← Truyền ID để Refine tự gọi getOne() trước
      onMutationSuccess: () => {
        router.push("/dashboard/organizations");
      },
    },
  });

  const isLoadingData = query?.isLoading;

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/organizations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Chỉnh sửa Tổ chức #{id}</h1>
      </div>

      {isLoadingData ? (
        <p className="text-muted-foreground text-sm">Đang tải dữ liệu...</p>
      ) : (
        <form onSubmit={handleSubmit(onFinish)} className="flex flex-col gap-4">
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
            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message as string}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium">
              Mô tả
            </label>
            <textarea
              id="description"
              rows={3}
              className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              {...register("description")}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={formLoading}>
              {formLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
            <Link href="/dashboard/organizations">
              <Button variant="outline" type="button">
                Hủy
              </Button>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
