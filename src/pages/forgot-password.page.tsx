import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import ForgotPasswordForm from "@/features/auth/components/forgot-password-form";
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password";
import type { ForgotPasswordFormValues } from "@/features/auth/validations";
import { CheckCircle2Icon } from "lucide-react";
import { FormProvider, type SubmitHandler } from "react-hook-form";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const { forgotMethods, forgotPassword, isSending, isSuccess, message } =
    useForgotPassword();

  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = (data) => {
    forgotPassword({ body: data });
  };

  return (
    <Card className="w-full max-w-md p-6">
      {isSuccess ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2Icon className="size-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">Đã gửi yêu cầu</p>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
          <Button variant="outline" className="w-full" render={<Link to="/sign-in" />}>
            Về trang đăng nhập
          </Button>
        </div>
      ) : (
        <FormProvider {...forgotMethods}>
          <form
            onSubmit={forgotMethods.handleSubmit(onSubmit)}
            className="flex w-full flex-col gap-6"
          >
            <div className="text-center">
              <p className="text-2xl font-bold">Quên mật khẩu</p>
              <p className="text-sm text-muted-foreground">
                Nhập email để nhận liên kết đặt lại mật khẩu
              </p>
            </div>

            <ForgotPasswordForm />

            <Button type="submit" disabled={isSending} className="w-full">
              {isSending ? <Spinner /> : null}
              Gửi liên kết đặt lại
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Nhớ mật khẩu rồi?{" "}
              <Link to="/sign-in" className="text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </form>
        </FormProvider>
      )}
    </Card>
  );
}
