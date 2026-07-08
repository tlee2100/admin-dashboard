import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const twoFactorSchema = z.object({
  code: z
    .string()
    .length(6, "Mã 2FA phải gồm 6 chữ số")
    .regex(/^\d{6}$/, "Mã 2FA chỉ gồm chữ số"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type TwoFactorInput = z.infer<typeof twoFactorSchema>;
