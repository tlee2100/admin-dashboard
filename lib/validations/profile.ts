import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên"),
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  bio: z.string().max(300, "Tối đa 300 ký tự").optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
export const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
