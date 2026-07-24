import type { ErrorResponse } from "@/lib/auth/api";
import { isAxiosError } from "axios";

// Lấy thông điệp lỗi tiếng Việt từ backend (ErrorResponse.detail) để hiện cho user.
// Các messageCode hay gặp: PROJECT_CODE_TAKEN, ALREADY_MEMBER, LAST_OWNER, và 404 khi
// email chưa có tài khoản ("Người dùng với email này ... không tồn tại").
export const errorDetail = (error: unknown, fallback: string): string => {
  if (isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.detail ?? fallback;
  }
  return fallback;
};
