import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import SignInForm from "@/features/auth/components/sign-in-form";
import { fakeSignIn } from "@/features/auth/fake";
import { useSignIn } from "@/features/auth/hooks/use-sign-in";
import type { SignInFormValues } from "@/features/auth/validations";
import { FormProvider, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";

export default function SignInPage() {
  const { signInMethods, isSigningIn, signIn } = useSignIn();
  const navigate = useNavigate();

  const onSignIn: SubmitHandler<SignInFormValues> = (data) => {
    signIn({ body: data });
  };

  const onFake = () => {
    fakeSignIn();
    navigate("/", { replace: true });
  };

  return (
    <Card className="w-full max-w-md p-6">
      <FormProvider {...signInMethods}>
        <form
          onSubmit={signInMethods.handleSubmit(onSignIn)}
          className="flex w-full flex-col gap-6"
        >
          <div className="text-center">
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

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            hoặc
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onFake}
            className="w-full"
          >
            🎭 Fake sign-in (dev)
          </Button>
        </form>
      </FormProvider>
    </Card>
  );
}
