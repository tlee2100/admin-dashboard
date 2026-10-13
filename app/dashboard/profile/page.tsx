"use client";

import { useEffect, useState, useRef } from "react";
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

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "", bio: "" },
  });

  useEffect(() => {
    if (!session?.user) return;

    reset({
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      bio: session.user.bio ?? "",
    });
  }, [reset, session?.user]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAvatarError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Only JPEG, PNG or WEBP images are accepted");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("Image must be 2MB or less");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(file);
    });
  }

  async function onSubmit(values: ProfileInput) {
    setFormError("");
    setFormSuccess("");
    setIsSaving(true);
    try {
      let newAvatarUrl = session?.user?.avatarUrl;

      // 1. Upload avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const res = await fetch("/api/profile/avatar", {
          method: "PATCH",
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) {
          setFormError(data?.message ?? "Failed to upload avatar");
          setIsSaving(false);
          return;
        }

        newAvatarUrl = data.avatarUrl;
        setAvatarFile(null); // Clear selected file after successful upload
      }

      // 2. Update profile information
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data?.message ?? "Update failed");
        return;
      }

      // 3. Update session once with all changes
      await update({ name: data.name, bio: data.bio, avatarUrl: newAvatarUrl });
      setFormSuccess("Changes saved successfully");
    } catch {
      setFormError("Unable to connect to the server");
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
          <CardTitle>Profile Picture</CardTitle>
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
            {avatarError && (
              <p className="text-sm text-destructive">{avatarError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              JPEG, PNG or WEBP, max 2MB
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
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
              <label className="mb-1 block text-sm font-medium">Bio</label>
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
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
