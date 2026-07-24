import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import userService from "../services";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../validations";

export const useForgotPassword = () => {
  const forgotMethods = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: "" },
    resolver: zodResolver(forgotPasswordSchema),
  });

  const {
    mutate: forgotPassword,
    isPending: isSending,
    isSuccess,
    data,
  } = useMutation({
    mutationFn: userService.forgotPassword,
  });

  return {
    forgotMethods,
    forgotPassword,
    isSending,
    isSuccess,
    // Thông điệp trung lập; nếu backend không trả thì dùng câu mặc định tương đương.
    message:
      data?.message ??
      "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong ít phút.",
  };
};
