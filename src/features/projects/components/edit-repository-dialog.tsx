import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { errorDetail } from "../error";
import { useUpdateRepository } from "../hooks/use-repository-mutations";
import type { RepositoryInfo } from "../repository-types";
import { updateRepositorySchema } from "../repository-validations";

interface EditRepositoryDialogProps {
  projectId: string;
  repository: RepositoryInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRepositoryDialog({
  projectId,
  repository,
  open,
  onOpenChange,
}: EditRepositoryDialogProps) {
  const [defaultBranch, setDefaultBranch] = useState(repository.defaultBranch);
  const [basePath, setBasePath] = useState(repository.basePath);
  const [isActive, setIsActive] = useState(repository.isActive);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nạp lại giá trị khi dialog mở (chỉnh state theo prop trong render — không setState effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open && !wasOpen) {
    setWasOpen(true);
    setDefaultBranch(repository.defaultBranch);
    setBasePath(repository.basePath);
    setIsActive(repository.isActive);
    setToken("");
    setShowToken(false);
    setError(null);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const updateRepository = useUpdateRepository(projectId);

  const submit = () => {
    setError(null);
    const parsed = updateRepositorySchema.safeParse({
      defaultBranch,
      basePath,
      isActive,
      token,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
      return;
    }
    const trimmedToken = parsed.data.token.trim();
    updateRepository.mutate(
      {
        repositoryId: repository.id,
        values: {
          defaultBranch: parsed.data.defaultBranch,
          basePath: parsed.data.basePath,
          isActive: parsed.data.isActive,
          // Bỏ trống → không gửi token → backend giữ token cũ.
          token: trimmedToken ? trimmedToken : undefined,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) =>
          setError(errorDetail(err, "Cập nhật kho thất bại.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-lg">
        <DialogHeader>
          <DialogTitle>
            Sửa kho {repository.owner}/{repository.name}
          </DialogTitle>
          <DialogDescription>
            Owner/tên repo không đổi được. Bỏ trống token để giữ token hiện tại.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field className="gap-1">
              <FieldLabel htmlFor="edit-repo-branch">Branch mặc định</FieldLabel>
              <Input
                id="edit-repo-branch"
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
                placeholder="main"
                spellCheck={false}
                autoComplete="off"
                autoFocus
              />
            </Field>

            <Field className="gap-1">
              <FieldLabel htmlFor="edit-repo-basepath">Base path</FieldLabel>
              <Input
                id="edit-repo-basepath"
                value={basePath}
                onChange={(e) => setBasePath(e.target.value)}
                placeholder="docs"
                spellCheck={false}
                autoComplete="off"
              />
            </Field>
          </div>

          <Field className="gap-1">
            <FieldLabel htmlFor="edit-repo-active">Trạng thái</FieldLabel>
            <Select
              value={String(isActive)}
              onValueChange={(v) => setIsActive(v === "true")}
            >
              <SelectTrigger id="edit-repo-active" className="h-8 text-xs">
                <SelectValue>
                  {(v) => (v === "true" ? "Đang bật" : "Đã tắt")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true" className="text-xs">
                  Đang bật
                </SelectItem>
                <SelectItem value="false" className="text-xs">
                  Đã tắt
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field className="gap-1">
            <FieldLabel htmlFor="edit-repo-token">Token GitHub</FieldLabel>
            <div className="relative">
              <Input
                id="edit-repo-token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={
                  repository.hasToken
                    ? "Để trống để giữ token hiện tại"
                    : "Chưa có token — nhập token mới"
                }
                spellCheck={false}
                // Chặn Chrome tự điền mật khẩu đăng nhập đã lưu vào ô token.
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
          </Field>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={updateRepository.isPending}>
            {updateRepository.isPending && <Spinner />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
