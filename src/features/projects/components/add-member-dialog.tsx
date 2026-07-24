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
import { useState } from "react";
import { errorDetail } from "../error";
import { useAddMember } from "../hooks/use-member-mutations";
import { ProjectRole } from "../types";
import { addMemberSchema } from "../validations";
import { RoleSelect } from "./role-select";

interface AddMemberDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({
  projectId,
  open,
  onOpenChange,
}: AddMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectRole>(ProjectRole.Editor);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const addMember = useAddMember(projectId);

  const reset = () => {
    setEmail("");
    setRole(ProjectRole.Editor);
    setEmailError(null);
    setSubmitError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = () => {
    setSubmitError(null);
    const parsed = addMemberSchema.safeParse({ email, role });
    if (!parsed.success) {
      setEmailError(
        parsed.error.issues.find((i) => i.path[0] === "email")?.message ??
          "Dữ liệu không hợp lệ",
      );
      return;
    }
    setEmailError(null);
    addMember.mutate(parsed.data, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
      onError: (err) =>
        setSubmitError(
          errorDetail(
            err,
            "Không thêm được thành viên. Người này có thể chưa có tài khoản.",
          ),
        ),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="min-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm thành viên</DialogTitle>
          <DialogDescription>
            Người được thêm phải đã có tài khoản trên hệ thống (theo email).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field data-invalid={!!emailError || undefined} className="gap-1">
            <FieldLabel htmlFor="member-email">Email</FieldLabel>
            <Input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="thanhvien@example.com"
              spellCheck={false}
              autoFocus
            />
            {emailError && (
              <FieldError
                className="text-xs"
                errors={[{ message: emailError }]}
              />
            )}
          </Field>

          <Field className="gap-1">
            <FieldLabel htmlFor="member-role">Vai trò</FieldLabel>
            <RoleSelect value={role} onChange={setRole} withDescription />
          </Field>

          {submitError && (
            <p className="text-xs text-destructive">{submitError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={addMember.isPending}>
            {addMember.isPending && <Spinner />}
            Thêm thành viên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
