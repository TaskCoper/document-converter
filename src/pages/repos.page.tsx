import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  useReposStore,
  type RepoConfig,
  type RepoInput,
} from "@/features/repos/store";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import {
  AlertTriangle,
  KeyRound,
  Loader2,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type RepoMeta = {
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
};

type MetaError =
  | { kind: "unauthorized" }
  | { kind: "not-found" }
  | { kind: "other"; message: string };

async function fetchRepoMeta(cfg: RepoConfig): Promise<RepoMeta> {
  const { data } = await axios.get(
    `https://api.github.com/repos/${cfg.owner}/${cfg.repo}`,
    {
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10",
      },
    },
  );
  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    htmlUrl: data.html_url,
  };
}

function toMetaError(err: unknown): MetaError {
  if (err instanceof AxiosError && err.response) {
    if (err.response.status === 401) return { kind: "unauthorized" };
    if (err.response.status === 404) return { kind: "not-found" };
    return {
      kind: "other",
      message: err.response.data?.message ?? "Không tải được thông tin kho.",
    };
  }
  return {
    kind: "other",
    message: err instanceof Error ? err.message : "Lỗi không xác định.",
  };
}

const emptyInput: RepoInput = {
  token: "",
  owner: "",
  repo: "",
  branch: "main",
  rootDir: "",
  label: "",
};

function RepoFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: RepoInput;
  onSubmit: (values: RepoInput) => void;
}) {
  const [form, setForm] = useState<RepoInput>(initial ?? emptyInput);
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setForm(initial ?? emptyInput);
  }

  const canSubmit = form.token.trim() && form.owner.trim() && form.repo.trim();

  const set = <K extends keyof RepoInput>(key: K, value: RepoInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent position="top-center" className="min-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Sửa kho" : "Thêm kho GitHub"}</DialogTitle>
          <DialogDescription>
            Token và các trường bên dưới tương ứng với biến trong{" "}
            <code>.env.example</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="repo-label">
              Nhãn hiển thị (tuỳ chọn)
            </FieldLabel>
            <Input
              id="repo-label"
              value={form.label ?? ""}
              onChange={(e) => set("label", e.target.value)}
              placeholder="Ví dụ: Dự án A"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="repo-token">
              Token (VITE_GH_TOKEN) *
            </FieldLabel>
            <Input
              id="repo-token"
              type="password"
              autoComplete="off"
              value={form.token}
              onChange={(e) => set("token", e.target.value)}
              placeholder="ghp_..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="repo-owner">Owner *</FieldLabel>
              <Input
                id="repo-owner"
                value={form.owner}
                onChange={(e) => set("owner", e.target.value)}
                placeholder="owner"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="repo-repo">Repo *</FieldLabel>
              <Input
                id="repo-repo"
                value={form.repo}
                onChange={(e) => set("repo", e.target.value)}
                placeholder="repository-name"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="repo-branch">Branch</FieldLabel>
              <Input
                id="repo-branch"
                value={form.branch}
                onChange={(e) => set("branch", e.target.value)}
                placeholder="main"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="repo-root">Root dir</FieldLabel>
              <Input
                id="repo-root"
                value={form.rootDir}
                onChange={(e) => set("rootDir", e.target.value)}
                placeholder="docs"
              />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button disabled={!canSubmit} onClick={submit}>
            {initial ? "Lưu" : "Thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Badge({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-none border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

function RepoCard({
  cfg,
  onOpen,
  onEdit,
  onDelete,
}: {
  cfg: RepoConfig;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const query = useQuery<RepoMeta, MetaError>({
    queryKey: ["repo-meta", cfg.id, cfg.owner, cfg.repo, cfg.token],
    queryFn: async () => {
      try {
        return await fetchRepoMeta(cfg);
      } catch (e) {
        throw toMetaError(e);
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  const title = cfg.label || `${cfg.owner}/${cfg.repo}`;

  return (
    <div
      className={cn(
        "group flex flex-col gap-3 border border-border bg-background p-4 transition-colors",
        "hover:border-primary/60 hover:bg-muted/40 cursor-pointer",
      )}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{title}</div>
          {cfg.label && (
            <div className="truncate text-[11px] text-muted-foreground">
              {cfg.owner}/{cfg.repo}
            </div>
          )}
        </div>
        <div
          className="flex opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="ghost" size="icon-xs" onClick={onEdit} title="Sửa">
            <PencilIcon />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onDelete} title="Xoá">
            <TrashIcon />
          </Button>
        </div>
      </div>

      <div className="min-h-[2.5rem] text-xs text-muted-foreground">
        {query.isPending && (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin" /> Đang tải…
          </span>
        )}
        {query.isSuccess && (query.data.description || "Không có mô tả.")}
        {query.isError && query.error.kind === "unauthorized" && (
          <span className="inline-flex items-center gap-1.5 text-destructive">
            <KeyRound className="size-3" /> Token không hợp lệ.
          </span>
        )}
        {query.isError && query.error.kind === "not-found" && (
          <span className="inline-flex items-center gap-1.5 text-destructive">
            <AlertTriangle className="size-3" /> Không tìm thấy kho.
          </span>
        )}
        {query.isError && query.error.kind === "other" && (
          <span className="inline-flex items-center gap-1.5 text-destructive">
            <AlertTriangle className="size-3" /> {query.error.message}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge>{cfg.branch}</Badge>
        {cfg.rootDir && <Badge>:{cfg.rootDir}/</Badge>}
      </div>
    </div>
  );
}

export default function ReposPage() {
  const repos = useReposStore((s) => s.repos);
  const add = useReposStore((s) => s.add);
  const update = useReposStore((s) => s.update);
  const remove = useReposStore((s) => s.remove);
  const setActive = useReposStore((s) => s.setActive);
  const navigate = useNavigate();

  const [formState, setFormState] = useState<
    { mode: "add" } | { mode: "edit"; id: string } | null
  >(null);
  const [pendingDelete, setPendingDelete] = useState<RepoConfig | null>(null);

  const editing = useMemo(() => {
    if (formState?.mode !== "edit") return undefined;
    const target = repos.find((r) => r.id === formState.id);
    if (!target) return undefined;
    return {
      token: target.token,
      owner: target.owner,
      repo: target.repo,
      branch: target.branch,
      rootDir: target.rootDir,
      label: target.label,
    };
  }, [formState, repos]);

  const openRepo = (id: string) => {
    setActive(id);
    navigate("/browse");
  };

  const submitForm = (values: RepoInput) => {
    if (formState?.mode === "edit") {
      update(formState.id, values);
    } else {
      add(values);
    }
    setFormState(null);
  };

  const confirmDelete = () => {
    if (pendingDelete) remove(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Danh sách kho</h1>
          <p className="text-xs text-muted-foreground">
            Chọn một kho để bắt đầu, hoặc thêm kho mới.
          </p>
        </div>
        <Button onClick={() => setFormState({ mode: "add" })}>
          <PlusIcon />
          Thêm kho
        </Button>
      </div>

      {repos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Chưa có kho nào. Thêm kho GitHub đầu tiên để bắt đầu.
          </p>
          <Button onClick={() => setFormState({ mode: "add" })}>
            <PlusIcon />
            Thêm kho
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {repos.map((r) => (
            <RepoCard
              key={r.id}
              cfg={r}
              onOpen={() => openRepo(r.id)}
              onEdit={() => setFormState({ mode: "edit", id: r.id })}
              onDelete={() => setPendingDelete(r)}
            />
          ))}
        </div>
      )}

      <RepoFormDialog
        open={formState !== null}
        onOpenChange={(open) => !open && setFormState(null)}
        initial={editing}
        onSubmit={submitForm}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá kho này?</AlertDialogTitle>
            <AlertDialogDescription>
              Chỉ xoá khỏi danh sách trên trình duyệt này. Kho GitHub thật không
              bị ảnh hưởng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Xoá</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
