import { z } from "zod";

export const signInSchema = z
  .object({
    email: z.email("Email không hợp lệ").trim(),
    password: z.string().trim().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  })
  .strict();

export type SignInFormValues = z.infer<typeof signInSchema>;
