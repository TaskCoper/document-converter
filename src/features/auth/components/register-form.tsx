import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { RegisterFormValues } from "../validations";

export default function RegisterForm() {
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const { control } = useFormContext<RegisterFormValues>();

  return (
    <div className="space-y-1">
      <Controller
        name="fullName"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-1">
            <FieldLabel htmlFor={field.name}>Họ và tên</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="Nguyễn Văn A"
              autoFocus
              autoComplete="name"
            />
            <div className="min-h-4">
              {fieldState.invalid && (
                <FieldError className="text-xs" errors={[fieldState.error]} />
              )}
            </div>
          </Field>
        )}
      />

      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-1">
            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="you@example.com"
              spellCheck={false}
              autoComplete="username"
            />
            <div className="min-h-4">
              {fieldState.invalid && (
                <FieldError className="text-xs" errors={[fieldState.error]} />
              )}
            </div>
          </Field>
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-1">
            <FieldLabel htmlFor={field.name}>Mật khẩu</FieldLabel>
            <div className="relative">
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                type={isVisible ? "text" : "password"}
                placeholder="Tối thiểu 8 ký tự"
                spellCheck={false}
                autoComplete="new-password"
              />
              <Button
                variant="ghost"
                type="button"
                size="icon"
                onClick={() => setIsVisible((v) => !v)}
                className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
              >
                {isVisible ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            </div>
            <div className="min-h-4">
              {fieldState.invalid && (
                <FieldError className="text-xs" errors={[fieldState.error]} />
              )}
            </div>
          </Field>
        )}
      />

      <Controller
        name="confirmPassword"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-1">
            <FieldLabel htmlFor={field.name}>Nhập lại mật khẩu</FieldLabel>
            <div className="relative">
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                type={isConfirmVisible ? "text" : "password"}
                placeholder="••••••••"
                spellCheck={false}
                autoComplete="new-password"
              />
              <Button
                variant="ghost"
                type="button"
                size="icon"
                onClick={() => setIsConfirmVisible((v) => !v)}
                className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
              >
                {isConfirmVisible ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            </div>
            <div className="min-h-4">
              {fieldState.invalid && (
                <FieldError className="text-xs" errors={[fieldState.error]} />
              )}
            </div>
          </Field>
        )}
      />
    </div>
  );
}
