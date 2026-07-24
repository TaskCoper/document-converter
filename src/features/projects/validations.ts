import { z } from "zod";
import { ProjectRole } from "./types";

const roleField = z
  .number()
  .int()
  .refine(
    (v): v is ProjectRole =>
      v === ProjectRole.Owner ||
      v === ProjectRole.Admin ||
      v === ProjectRole.Editor ||
      v === ProjectRole.Viewer,
    "Vai trò không hợp lệ",
  );

export const createProjectSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập mã dự án")
      .max(50, "Mã tối đa 50 ký tự")
      .regex(
        /^[a-z0-9][a-z0-9-]*$/,
        "Mã chỉ gồm chữ thường, số và dấu gạch ngang",
      ),
    name: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên dự án")
      .max(200, "Tên tối đa 200 ký tự"),
    description: z.string().trim().max(2000, "Mô tả tối đa 2000 ký tự"),
  })
  .strict();

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên dự án")
      .max(200, "Tên tối đa 200 ký tự"),
    description: z.string().trim().max(2000, "Mô tả tối đa 2000 ký tự"),
  })
  .strict();

export type UpdateProjectFormValues = z.infer<typeof updateProjectSchema>;

export const addMemberSchema = z
  .object({
    email: z.email("Email không hợp lệ").trim(),
    role: roleField,
  })
  .strict();

export type AddMemberFormValues = z.infer<typeof addMemberSchema>;
