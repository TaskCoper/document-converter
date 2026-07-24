import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import userService from "../services";
import { registerSchema, type RegisterFormValues } from "../validations";

interface ApiErrorBody {
  detail?: string;
}

export const useRegister = () => {
  const navigate = useNavigate();

  const registerMethods = useForm<RegisterFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(registerSchema),
  });

  const { mutate: registerUser, isPending: isRegistering } = useMutation({
    mutationFn: userService.register,
    onSuccess: () => {
      registerMethods.reset();
      window.alert(
        "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản, sau đó đăng nhập.",
      );
      navigate("/sign-in", { replace: true });
    },
    onError: (error: AxiosError<ApiErrorBody>) => {
      const detail = error.response?.data?.detail ?? "Đăng ký thất bại";
      window.alert(detail);
    },
  });

  return { registerMethods, isRegistering, registerUser };
};
