import { authKeys } from "@/lib/query-keys";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import userService from "../services";
import { useAuthStore } from "../store";
import { signInSchema, type SignInFormValues } from "../validations";

interface ApiErrorBody {
  detail?: string;
}

export const useSignIn = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((s) => s.signIn);

  const signInMethods = useForm<SignInFormValues>({
    defaultValues: { email: "", password: "" },
    resolver: zodResolver(signInSchema),
  });

  const { mutate: signIn, isPending: isSigningIn } = useMutation({
    mutationFn: userService.signIn,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.removeQueries({ queryKey: authKeys.me() });
      signInMethods.reset();
      navigate("/", { replace: true });
    },
    onError: (error: AxiosError<ApiErrorBody>) => {
      const detail = error.response?.data?.detail ?? "Đăng nhập thất bại";
      window.alert(detail);
    },
  });

  return { signInMethods, isSigningIn, signIn };
};
