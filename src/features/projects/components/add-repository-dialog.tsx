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
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { errorDetail } from "../error";
import { useAddRepository } from "../hooks/use-repository-mutations";
import { addRepositorySchema } from "../repository-validations";

interface AddRepositoryDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FieldKey = "owner" | "name" | "defaultBranch" | "basePath" | "token";
type FieldErrors = Partial<Record<FieldKey, string>>;

export function AddRepositoryDialog({
  projectId,
  open,
  onOpenChange,
}: AddRepositoryDialogProps) {
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("");
  const [basePath, setBasePath] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const addRepository = useAddRepository(projectId);

  const reset = () => {
    setOwner("");
    setName("");
    setDefaultBranch("");
    setBasePath("");
    setToken("");
    setShowToken(false);
    setErrors({});
    setSubmitError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = () => {
    setSubmitError(null);
    const parsed = addRepositorySchema.safeParse({
      owner,
      name,
      defaultBranch,
      basePath,
      token,
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldKey;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    addRepository.mutate(parsed.data, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
      onError: (err) =>
        setSubmitError(errorDetail(err, "Không thêm được kho.")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="min-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm kho GitHub</DialogTitle>
          <DialogDescription>
            Token được mã hoá (AES-256) trước khi lưu và không bao giờ trả về.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!errors.owner || undefined} className="gap-1">
              <FieldLabel htmlFor="repo-owner">Owner</FieldLabel>
              <Input
                id="repo-owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="vd: my-org"
                spellCheck={false}
                autoComplete="off"
                autoFocus
              />
              {errors.owner && (
                <FieldError
                  className="text-xs"
                  errors={[{ message: errors.owner }]}
                />
              )}
            </Field>

            <Field data-invalid={!!errors.name || undefined} className="gap-1">
              <FieldLabel htmlFor="repo-name">Tên repo</FieldLabel>
              <Input
                id="repo-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="vd: docs-repo"
                spellCheck={false}
                autoComplete="off"
              />
              {errors.name && (
                <FieldError
                  className="text-xs"
                  errors={[{ message: errors.name }]}
                />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field className="gap-1">
              <FieldLabel htmlFor="repo-branch">Branch mặc định</FieldLabel>
              <Input
                id="repo-branch"
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
                placeholder="main"
                spellCheck={false}
                autoComplete="off"
              />
            </Field>

            <Field className="gap-1">
              <FieldLabel htmlFor="repo-basepath">Base path</FieldLabel>
              <Input
                id="repo-basepath"
                value={basePath}
                onChange={(e) => setBasePath(e.target.value)}
                placeholder="docs"
                spellCheck={false}
                autoComplete="off"
              />
            </Field>
          </div>

          <Field data-invalid={!!errors.token || undefined} className="gap-1">
            <FieldLabel htmlFor="repo-token">Token GitHub</FieldLabel>
            <div className="relative">
              <Input
                id="repo-token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                spellCheck={false}
                // "new-password" chặn Chrome tự điền MẬT KHẨU ĐĂNG NHẬP đã lưu vào ô token
                // (autoComplete="off" không chặn được password manager).
                autoComplete="new-password"
              />
              <Button
                variant="ghost"
                type="button"
                size="icon"
                onClick={() => setShowToken((v) => !v)}
                className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
              >
                {showToken ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Fine-grained PAT với quyền Contents: Read and write cho repo này.
            </p>
            {errors.token && (
              <FieldError
                className="text-xs"
                errors={[{ message: errors.token }]}
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
          <Button onClick={submit} disabled={addRepository.isPending}>
            {addRepository.isPending && <Spinner />}
            Thêm kho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
