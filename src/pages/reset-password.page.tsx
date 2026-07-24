import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import ResetPasswordForm from "@/features/auth/components/reset-password-form";
import { useResetPassword } from "@/features/auth/hooks/use-reset-password";
import type { ResetPasswordFormValues } from "@/features/auth/validations";
import { AlertTriangleIcon } from "lucide-react";
import { FormProvider, type SubmitHandler } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const { resetMethods, resetPassword, isResetting } = useResetPassword(token);

  const onSubmit: SubmitHandler<ResetPasswordFormValues> = (data) => {
    resetPassword(data);
  };

  if (!token) {
    return (
      <Card className="w-full max-w-md p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangleIcon className="size-8 text-destructive" />
          <div>
            <p className="text-2xl font-bold">Liên kết không hợp lệ</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Liên kết đặt lại mật khẩu thiếu mã token hoặc đã hỏng. Vui lòng yêu
              cầu gửi lại.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            render={<Link to="/forgot-password" />}
          >
            Yêu cầu liên kết mới
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-6">
      <FormProvider {...resetMethods}>
        <form
          onSubmit={resetMethods.handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-6"
        >
          <div className="text-center">
            <p className="text-2xl font-bold">Đặt lại mật khẩu</p>
            <p className="text-sm text-muted-foreground">
              Nhập mật khẩu mới cho tài khoản của bạn
            </p>
          </div>

          <ResetPasswordForm />

          <Button type="submit" disabled={isResetting} className="w-full">
            {isResetting ? <Spinner /> : null}
            Đặt lại mật khẩu
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/sign-in" className="text-primary hover:underline">
              Về trang đăng nhập
            </Link>
          </p>
        </form>
      </FormProvider>
    </Card>
  );
}
