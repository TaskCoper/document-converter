import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import userService from "../services";

interface ApiErrorBody {
  detail?: string;
}

// Gửi lại email xác thực. Trả về thông điệp trung lập từ backend để hiển thị.
export const useResendVerification = () => {
  const {
    mutate: resend,
    isPending: isResending,
    isSuccess,
    data,
    error,
  } = useMutation({
    mutationFn: userService.resendVerification,
  });

  const errorDetail = (error as AxiosError<ApiErrorBody> | null)?.response?.data
    ?.detail;

  return {
    resend,
    isResending,
    isSuccess,
    message: data?.message,
    errorDetail,
  };
};
