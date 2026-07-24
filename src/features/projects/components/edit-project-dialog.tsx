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
import { useUpdateProject } from "../hooks/use-project-mutations";
import type { ProjectDetail } from "../types";
import { updateProjectSchema } from "../validations";

interface EditProjectDialogProps {
  project: ProjectDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FieldErrors = Partial<Record<"name" | "description", string>>;

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
}: EditProjectDialogProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Nạp lại giá trị ngay lúc dialog chuyển sang mở (chỉnh state theo prop trong lúc
  // render — mẫu React chuẩn, tránh setState trong useEffect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open && !wasOpen) {
    setWasOpen(true);
    setName(project.name);
    setDescription(project.description ?? "");
    setErrors({});
    setSubmitError(null);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const updateProject = useUpdateProject(project.id);

  const submit = () => {
    setSubmitError(null);
    const parsed = updateProjectSchema.safeParse({ name, description });
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
    updateProject.mutate(parsed.data, {
      onSuccess: () => onOpenChange(false),
      onError: (err) =>
        setSubmitError(errorDetail(err, "Cập nhật dự án thất bại.")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-lg">
        <DialogHeader>
          <DialogTitle>Sửa dự án</DialogTitle>
          <DialogDescription>
            Mã dự án ({project.code}) không thể đổi.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field data-invalid={!!errors.name || undefined} className="gap-1">
            <FieldLabel htmlFor="edit-project-name">Tên dự án</FieldLabel>
            <Input
              id="edit-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {errors.name && (
              <FieldError
                className="text-xs"
                errors={[{ message: errors.name }]}
              />
            )}
          </Field>

          <Field
            data-invalid={!!errors.description || undefined}
            className="gap-1"
          >
            <FieldLabel htmlFor="edit-project-desc">Mô tả</FieldLabel>
            <Textarea
              id="edit-project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={updateProject.isPending}>
            {updateProject.isPending && <Spinner />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
