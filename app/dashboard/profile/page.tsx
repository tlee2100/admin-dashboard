"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Camera } from "lucide-react";
import {
  profileSchema,
  type ProfileInput,
  MAX_AVATAR_SIZE,
  ALLOWED_AVATAR_TYPES,
} from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: {
      name: session?.user?.name ?? "",
      email: session?.user?.email ?? "",
      bio: session?.user?.bio ?? "",
    },
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAvatarError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Chỉ chấp nhận ảnh JPEG, PNG hoặc WEBP");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("Ảnh tối đa 2MB");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleAvatarUpload() {
    if (!avatarFile) return;
    setIsUploadingAvatar(true);
    setAvatarError("");
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const res = await fetch("/api/profile/avatar", {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setAvatarError(data?.message ?? "Tải ảnh lên thất bại");
        return;
      }

      // Cập nhật session ngay để Header và mọi nơi khác thấy avatar mới
      // mà không cần F5 hay đăng nhập lại
      await update({ avatarUrl: data.avatarUrl });
      setAvatarFile(null);
    } catch {
      setAvatarError("Không thể kết nối tới máy chủ");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function onSubmit(values: ProfileInput) {
    setFormError("");
    setFormSuccess("");
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data?.message ?? "Cập nhật thất bại");
        return;
      }

      await update({ name: data.name, bio: data.bio });
      setFormSuccess("Đã lưu thay đổi");
    } catch {
      setFormError("Không thể kết nối tới máy chủ");
    } finally {
      setIsSaving(false);
    }
  }

  const displayAvatar =
    avatarPreview ??
    (session?.user?.avatarUrl
      ? `${process.env.NEXT_PUBLIC_API_URL}${session.user.avatarUrl}`
      : undefined);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Ảnh đại diện</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative"
          >
            <Avatar className="size-20">
              <AvatarImage src={displayAvatar} />
              <AvatarFallback>
                {(session?.user?.name ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-5 text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="flex flex-col gap-1">
            {avatarFile && (
              <Button
                size="sm"
                disabled={isUploadingAvatar}
                onClick={handleAvatarUpload}
              >
                {isUploadingAvatar && <Loader2 className="animate-spin" />}
                Lưu ảnh mới
              </Button>
            )}
            {avatarError && (
              <p className="text-sm text-destructive">{avatarError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              JPEG, PNG hoặc WEBP, tối đa 2MB
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Tên</label>
              <Input {...register("name")} />
              {errors.name && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input {...register("email")} type="email" />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Giới thiệu
              </label>
              <Textarea {...register("bio")} rows={3} />
              {errors.bio && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.bio.message}
                </p>
              )}
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            {formSuccess && (
              <p className="text-sm text-green-600">{formSuccess}</p>
            )}
          </CardContent>
          <div className="flex justify-end p-6 pt-0">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
