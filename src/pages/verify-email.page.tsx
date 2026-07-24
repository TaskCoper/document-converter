import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useResendVerification } from "@/features/auth/hooks/use-resend-verification";
import userService from "@/features/auth/services";
import { AlertTriangleIcon, CheckCircle2Icon, MailIcon } from "lucide-react";
import { isAxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

type Status = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [errorDetail, setErrorDetail] = useState(
    "Liên kết xác thực thiếu mã token hoặc đã hỏng.",
  );

  // Tự xác thực đúng MỘT lần khi mount. Gọi service trực tiếp (không qua useMutation
  // hay cờ cancel trong cleanup): token chỉ dùng được một lần nên phải gửi đúng một
  // request, và ở StrictMode dev cleanup sẽ huỷ oan request duy nhất đó. setState muộn
  // trên component đã unmount là no-op vô hại ở React 19.
  const hasRun = useRef(false);
  useEffect(() => {
    if (!token || hasRun.current) return;
    hasRun.current = true;

    userService
      .verifyEmail({ token })
      .then(() => setStatus("success"))
      .catch((err) => {
        const detail = isAxiosError(err)
          ? err.response?.data?.detail
          : undefined;
        setErrorDetail(
          detail ??
            "Xác thực email thất bại. Liên kết có thể đã hết hạn hoặc không hợp lệ.",
        );
        setStatus("error");
      });
  }, [token]);

  return (
    <Card className="w-full max-w-md p-6">
      {status === "verifying" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner className="size-8" />
          <p className="text-lg font-semibold">Đang xác thực email…</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2Icon className="size-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">Xác thực thành công</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Email của bạn đã được xác thực. Bạn có thể đăng nhập ngay.
            </p>
          </div>
          <Button className="w-full" render={<Link to="/sign-in" />}>
            Đăng nhập
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertTriangleIcon className="size-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold">Không xác thực được</p>
              <p className="mt-1 text-sm text-muted-foreground">{errorDetail}</p>
            </div>
          </div>
          <ResendVerification />
          <p className="text-center text-xs text-muted-foreground">
            <Link to="/sign-in" className="text-primary hover:underline">
              Về trang đăng nhập
            </Link>
          </p>
        </div>
      )}
    </Card>
  );
}

// Ô nhập email để gửi lại email xác thực. Backend trả thông điệp trung lập.
function ResendVerification() {
  const [email, setEmail] = useState("");
  const { resend, isResending, isSuccess, message } = useResendVerification();

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <div className="flex flex-col gap-2 border-t pt-4">
      <Field className="gap-1">
        <FieldLabel htmlFor="resend-email">Gửi lại email xác thực</FieldLabel>
        <Input
          id="resend-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          spellCheck={false}
          autoComplete="username"
        />
      </Field>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={!isValidEmail || isResending}
        onClick={() => resend({ email: email.trim() })}
      >
        {isResending ? <Spinner /> : <MailIcon />}
        Gửi lại email
      </Button>
      {isSuccess && message && (
        <p className="text-center text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
