import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import userService from "../services";
import { useAuthStore } from "../store";

interface ApiErrorBody {
  detail?: string;
}

// Thu hồi mọi phiên trên mọi thiết bị, rồi đăng xuất máy hiện tại.
export const useLogoutAll = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.signOut);
  const hasToken = useAuthStore((s) => !!s.accessToken);

  const clearLocal = () => {
    clearAuth();
    queryClient.clear();
    navigate("/sign-in", { replace: true });
  };

  const { mutate, isPending: isLoggingOutAll } = useMutation({
    mutationFn: userService.signOutAll,
    onSuccess: clearLocal,
    onError: (error: AxiosError<ApiErrorBody>) => {
      // Dù backend lỗi vẫn xoá trạng thái cục bộ.
      clearLocal();
      const detail = error.response?.data?.detail;
      if (detail) window.alert(detail);
    },
  });

  const logoutAll = () => {
    if (!hasToken) {
      clearLocal();
      return;
    }
    mutate();
  };

  return { logoutAll, isLoggingOutAll };
};
