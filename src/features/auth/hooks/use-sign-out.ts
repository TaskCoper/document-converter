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
  const email = useAuthStore((s) => s.user?.Email);

  const { mutate, isPending: isSigningOut } = useMutation({
    mutationFn: userService.signOut,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate("/sign-in", { replace: true });
    },
    onError: (error: AxiosError<ApiErrorBody>) => {
      // Even if the backend call fails, wipe local state so the user is
      // effectively signed out on this device.
      clearAuth();
      queryClient.clear();
      navigate("/sign-in", { replace: true });
      const detail = error.response?.data?.detail;
      if (detail) window.alert(detail);
    },
  });

  const signOut = () => {
    if (!email) {
      clearAuth();
      queryClient.clear();
      navigate("/sign-in", { replace: true });
      return;
    }
    mutate({ email });
  };

  return { signOut, isSigningOut };
};
