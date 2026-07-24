import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { errorDetail } from "../error";
import { useCreateProject } from "../hooks/use-project-mutations";
import type { ProjectDetail } from "../types";
import { createProjectSchema } from "../validations";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (project: ProjectDetail) => void;
}

type FieldErrors = Partial<Record<"code" | "name" | "description", string>>;

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateProjectDialogProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createProject = useCreateProject();

  const reset = () => {
    setCode("");
    setName("");
    setDescription("");
    setErrors({});
    setSubmitError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = () => {
    setSubmitError(null);
    const parsed = createProjectSchema.safeParse({ code, name, description });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    createProject.mutate(parsed.data, {
      onSuccess: (project) => {
        reset();
        onCreated(project);
      },
      onError: (err) =>
        setSubmitError(errorDetail(err, "Tạo dự án thất bại.")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="min-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo dự án mới</DialogTitle>
          <DialogDescription>
            Bạn sẽ trở thành Chủ sở hữu của dự án này.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field data-invalid={!!errors.code || undefined} className="gap-1">
            <FieldLabel htmlFor="project-code">Mã dự án</FieldLabel>
            <Input
              id="project-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="vd: baokim-web"
              spellCheck={false}
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground">
              Chữ thường, số và dấu gạch ngang. Dùng làm prefix cho mã tài liệu.
            </p>
            {errors.code && (
              <FieldError className="text-xs" errors={[{ message: errors.code }]} />
            )}
          </Field>

          <Field data-invalid={!!errors.name || undefined} className="gap-1">
            <FieldLabel htmlFor="project-name">Tên dự án</FieldLabel>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="vd: Cổng thanh toán Bảo Kim"
            />
            {errors.name && (
              <FieldError className="text-xs" errors={[{ message: errors.name }]} />
            )}
          </Field>

          <Field
            data-invalid={!!errors.description || undefined}
            className="gap-1"
          >
            <FieldLabel htmlFor="project-desc">Mô tả (tuỳ chọn)</FieldLabel>
            <Textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về dự án"
              rows={3}
            />
            {errors.description && (
              <FieldError
                className="text-xs"
                errors={[{ message: errors.description }]}
              />
            )}
          </Field>

          {submitError && (
            <p className="text-xs text-destructive">{submitError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={createProject.isPending}>
            {createProject.isPending && <Spinner />}
            Tạo dự án
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
