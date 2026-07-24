import { z } from "zod";

export const signInSchema = z
  .object({
    email: z.email("Email không hợp lệ").trim(),
    password: z.string().trim().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  })
  .strict();

export type SignInFormValues = z.infer<typeof signInSchema>;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập họ và tên")
      .max(200, "Họ và tên tối đa 200 ký tự"),
    email: z.email("Email không hợp lệ").trim(),
    password: z
      .string()
      .trim()
      .min(8, "Mật khẩu tối thiểu 8 ký tự")
      .max(128, "Mật khẩu tối đa 128 ký tự"),
    confirmPassword: z.string().trim(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z
  .object({
    email: z.email("Email không hợp lệ").trim(),
  })
  .strict();

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .trim()
      .min(8, "Mật khẩu tối thiểu 8 ký tự")
      .max(128, "Mật khẩu tối đa 128 ký tự"),
    confirmPassword: z.string().trim(),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// Dùng cho ô email khi gửi lại email xác thực (không có token đăng nhập).
export const resendVerificationSchema = z
  .object({
    email: z.email("Email không hợp lệ").trim(),
  })
  .strict();

export type ResendVerificationFormValues = z.infer<
  typeof resendVerificationSchema
>;
