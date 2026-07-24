import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import RegisterForm from "@/features/auth/components/register-form";
import { useRegister } from "@/features/auth/hooks/use-register";
import type { RegisterFormValues } from "@/features/auth/validations";
import { FormProvider, type SubmitHandler } from "react-hook-form";
import { Link } from "react-router-dom";

export default function RegisterPage() {
  const { registerMethods, isRegistering, registerUser } = useRegister();

  const onRegister: SubmitHandler<RegisterFormValues> = (data) => {
    registerUser({ body: data });
  };

  return (
    <Card className="w-full max-w-md p-6">
      <FormProvider {...registerMethods}>
        <form
          onSubmit={registerMethods.handleSubmit(onRegister)}
          className="flex w-full flex-col gap-6"
        >
          <div className="text-center">
            <p className="text-2xl font-bold">Đăng ký</p>
            <p className="text-sm text-muted-foreground">
              Tạo tài khoản mới để bắt đầu
            </p>
          </div>

          <RegisterForm />

          <Button type="submit" disabled={isRegistering} className="w-full">
            {isRegistering ? <Spinner /> : null}
            Đăng ký
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link to="/sign-in" className="text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </form>
      </FormProvider>
    </Card>
  );
}
