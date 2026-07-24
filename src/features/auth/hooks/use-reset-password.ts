import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import userService from "../services";
import { useAuthStore } from "../store";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../validations";

interface ApiErrorBody {
  detail?: string;
}

export const useResetPassword = (token: string) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.signOut);

  const resetMethods = useForm<ResetPasswordFormValues>({
    defaultValues: { newPassword: "", confirmPassword: "" },
    resolver: zodResolver(resetPasswordSchema),
  });

  const { mutate, isPending: isResetting } = useMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      userService.resetPassword({ token, newPassword: values.newPassword }),
    onSuccess: () => {
      // Đổi mật khẩu ⇒ backend thu hồi mọi phiên ⇒ xoá trạng thái cục bộ luôn.
      clearAuth();
      queryClient.clear();
      window.alert(
        "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
      );
      navigate("/sign-in", { replace: true });
    },
    onError: (error: AxiosError<ApiErrorBody>) => {
      const detail =
        error.response?.data?.detail ??
        "Đặt lại mật khẩu thất bại. Liên kết có thể đã hết hạn.";
      window.alert(detail);
    },
  });

  return { resetMethods, resetPassword: mutate, isResetting };
};
