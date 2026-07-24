import { z } from "zod";

export const addRepositorySchema = z
  .object({
    owner: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập Owner")
      .max(100, "Owner tối đa 100 ký tự"),
    name: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên repo")
      .max(200, "Tên tối đa 200 ký tự"),
    defaultBranch: z.string().trim().max(100, "Branch tối đa 100 ký tự"),
    basePath: z.string().trim().max(500, "Base path tối đa 500 ký tự"),
    token: z.string().trim().min(1, "Vui lòng nhập token GitHub"),
  })
  .strict();

export type AddRepositoryFormValues = z.infer<typeof addRepositorySchema>;

// Update: token bỏ trống = giữ token cũ (không bắt buộc).
export const updateRepositorySchema = z
  .object({
    defaultBranch: z.string().trim().max(100, "Branch tối đa 100 ký tự"),
    basePath: z.string().trim().max(500, "Base path tối đa 500 ký tự"),
    isActive: z.boolean(),
    token: z.string().trim().max(500, "Token quá dài"),
  })
  .strict();

export type UpdateRepositoryFormValues = z.infer<typeof updateRepositorySchema>;
