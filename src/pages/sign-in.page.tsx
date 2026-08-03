import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import SignInForm from "@/features/auth/components/sign-in-form";
import { useSignIn } from "@/features/auth/hooks/use-sign-in";
import type { SignInFormValues } from "@/features/auth/validations";
import { FormProvider, type SubmitHandler } from "react-hook-form";
import { Link } from "react-router-dom";

export default function SignInPage() {
  const { signInMethods, isSigningIn, signIn } = useSignIn();

  const onSignIn: SubmitHandler<SignInFormValues> = (data) => {
    signIn({ body: data });
  };

  return (
    <Card className="w-full max-w-md p-6">
      <FormProvider {...signInMethods}>
        <form
          onSubmit={signInMethods.handleSubmit(onSignIn)}
          className="flex w-full flex-col gap-6"
        >
          <div className="text-center">
            <img
              src="/logo-header.png"
              alt="VNZ"
              width={480}
              height={219}
              className="mx-auto mb-4 h-16 w-auto object-contain"
            />
            <p className="text-2xl font-bold">Đăng nhập</p>
            <p className="text-sm text-muted-foreground">
              Nhập email và mật khẩu để tiếp tục
            </p>
          </div>

          <SignInForm />

          <Button type="submit" disabled={isSigningIn} className="w-full">
            {isSigningIn ? <Spinner /> : null}
            Đăng nhập
          </Button>

          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <p>
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Đăng ký
              </Link>
            </p>
            <Link
              to="/forgot-password"
              className="text-primary hover:underline"
            >
              Quên mật khẩu?
            </Link>
            <nav
              aria-label="Thông tin pháp lý"
              className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]"
            >
              <Link to="/privacy" className="hover:text-primary hover:underline">
                Quyền riêng tư
              </Link>
              <Link to="/terms" className="hover:text-primary hover:underline">
                Điều khoản
              </Link>
              <Link to="/support" className="hover:text-primary hover:underline">
                Hỗ trợ
              </Link>
            </nav>
          </div>
        </form>
      </FormProvider>
    </Card>
  );
}
