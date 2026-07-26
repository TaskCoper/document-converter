import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import userService from "../services";
import { useAuthStore } from "../store";

interface ApiErrorBody {
  detail?: string;
}

export const useSignOut = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.signOut);
  const hasToken = useAuthStore((s) => !!s.accessToken);

  const clearLocal = () => {
    clearAuth();
    queryClient.clear();
    navigate("/sign-in", { replace: true });
  };

  const { mutate, isPending: isSigningOut } = useMutation({
    mutationFn: userService.signOut,
    onSuccess: clearLocal,
    onError: (error: AxiosError<ApiErrorBody>) => {
      // Kể cả khi backend lỗi, vẫn xoá trạng thái cục bộ để coi như đã đăng xuất
      // trên máy này.
      clearLocal();
      const detail = error.response?.data?.detail;
      if (detail) window.alert(detail);
    },
  });

  const signOut = () => {
    // Chưa có phiên nào → không có gì để thu hồi ở backend.
    if (!hasToken) {
      clearLocal();
      return;
    }
    mutate();
  };

  return { signOut, isSigningOut };
};
