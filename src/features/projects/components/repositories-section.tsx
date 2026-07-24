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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  CheckCircle2Icon,
  KeyIcon,
  KeyRoundIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XCircleIcon,
  ZapIcon,
} from "lucide-react";
import { useState } from "react";
import { errorDetail } from "../error";
import {
  useDeleteRepository,
  useTestRepository,
  useUpdateRepository,
} from "../hooks/use-repository-mutations";
import { useRepositories } from "../hooks/use-repositories";
import type { ConnectionTest, RepositoryInfo } from "../repository-types";
import { AddRepositoryDialog } from "./add-repository-dialog";
import { EditRepositoryDialog } from "./edit-repository-dialog";

type TestState = ConnectionTest | { error: string };

export function RepositoriesSection({ projectId }: { projectId: string }) {
  const { repositories, isLoading, isError } = useRepositories(projectId);
  const testRepo = useTestRepository(projectId);
  const updateRepo = useUpdateRepository(projectId);
  const deleteRepo = useDeleteRepository(projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<RepositoryInfo | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RepositoryInfo | null>(
    null,
  );
  const [testResults, setTestResults] = useState<Record<string, TestState>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const runTest = (repo: RepositoryInfo) => {
    setBusyId(repo.id);
    testRepo.mutate(repo.id, {
      onSuccess: (result) =>
        setTestResults((prev) => ({ ...prev, [repo.id]: result })),
      onError: (err) =>
        setTestResults((prev) => ({
          ...prev,
          [repo.id]: { error: errorDetail(err, "Gọi thử thất bại.") },
        })),
      onSettled: () => setBusyId(null),
    });
  };

  const toggleActive = (repo: RepositoryInfo) => {
    setBusyId(repo.id);
    updateRepo.mutate(
      {
        repositoryId: repo.id,
        values: {
          defaultBranch: repo.defaultBranch,
          basePath: repo.basePath,
          isActive: !repo.isActive,
          // token bỏ qua → giữ token cũ.
        },
      },
      { onSettled: () => setBusyId(null) },
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setBusyId(id);
    deleteRepo.mutate(id, {
      onSettled: () => {
        setBusyId(null);
        setPendingDelete(null);
      },
    });
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-primary">
            Kho GitHub ({repositories.length})
          </h2>
          <p className="text-[10px] text-muted-foreground">
            Đích xuất bản tài liệu. Token được mã hoá và không bao giờ hiển thị
            lại.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon className="size-3.5" />
          Thêm kho
        </Button>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-xs text-destructive">
            Không tải được danh sách kho.
          </p>
        ) : repositories.length === 0 ? (
          <div className="border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
            Chưa cấu hình kho GitHub nào.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border/40">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-muted/60">
                <tr>
                  <th className="w-8 border border-border/40 px-2 py-1.5 text-left text-[10px] font-medium text-muted-foreground">
                    #
                  </th>
                  <th className="border border-border/40 px-2 py-1.5 text-left font-medium">
                    Repo
                  </th>
                  <th className="w-24 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Branch
                  </th>
                  <th className="w-28 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Base path
                  </th>
                  <th className="w-32 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Trạng thái
                  </th>
                  <th className="w-40 border border-border/40 px-2 py-1.5 text-right font-medium">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {repositories.map((repo, index) => {
                  const isBusy = busyId === repo.id;
                  const result = testResults[repo.id];
                  return (
                    <tr key={repo.id} className="hover:bg-primary/5">
                      <td className="border border-border/40 px-2 py-1.5 align-top text-[10px] text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="border border-border/40 px-2 py-1.5">
                        <div className="font-mono">
                          {repo.owner}/{repo.name}
                        </div>
                        {result && <TestResultLine result={result} />}
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top font-mono text-muted-foreground">
                        {repo.defaultBranch}
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top font-mono text-muted-foreground">
                        {repo.basePath || "—"}
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top">
                        <div className="flex flex-col items-start gap-1">
                          <button
                            type="button"
                            onClick={() => toggleActive(repo)}
                            disabled={isBusy}
                            title="Bấm để bật/tắt"
                            className="disabled:opacity-50"
                          >
                            <Badge
                              variant={repo.isActive ? "default" : "outline"}
                              className="cursor-pointer text-[10px]"
                            >
                              {repo.isActive ? "Đang bật" : "Đã tắt"}
                            </Badge>
                          </button>
                          <span
                            className="inline-flex items-center gap-1 text-[10px]"
                            title={
                              repo.hasToken
                                ? "Đã có token"
                                : "Chưa có token"
                            }
                          >
                            {repo.hasToken ? (
                              <KeyRoundIcon className="size-3 text-primary" />
                            ) : (
                              <KeyIcon className="size-3 text-destructive" />
                            )}
                            <span className="text-muted-foreground">
                              {repo.hasToken ? "Có token" : "Thiếu token"}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            disabled={isBusy}
                            onClick={() => runTest(repo)}
                            title="Gọi thử GitHub bằng token đang lưu"
                          >
                            {isBusy && testRepo.isPending ? (
                              <Spinner className="size-3" />
                            ) : (
                              <ZapIcon className="size-3" />
                            )}
                            Kiểm tra
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            disabled={isBusy}
                            onClick={() => setEditing(repo)}
                            title="Sửa"
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            disabled={isBusy}
                            onClick={() => setPendingDelete(repo)}
                            title="Xoá"
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddRepositoryDialog
        projectId={projectId}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
      {editing && (
        <EditRepositoryDialog
          projectId={projectId}
          repository={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá kho khỏi cấu hình?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.owner}/{pendingDelete?.name} sẽ bị gỡ khỏi dự án.
              Token đã lưu cũng bị xoá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteRepo.isPending && <Spinner />}
              Xoá kho
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TestResultLine({ result }: { result: TestState }) {
  if ("error" in result) {
    return (
      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-destructive">
        <XCircleIcon className="size-3 shrink-0" />
        <span className="truncate" title={result.error}>
          {result.error}
        </span>
      </div>
    );
  }
  if (result.ok) {
    return (
      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-primary">
        <CheckCircle2Icon className="size-3 shrink-0" />
        <span>
          Kết nối OK
          {result.rateLimitRemaining != null &&
            ` · rate-limit còn ${result.rateLimitRemaining}`}
        </span>
      </div>
    );
  }
  return (
    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-destructive">
      <XCircleIcon className="size-3 shrink-0" />
      <span className="truncate" title={result.message}>
        {result.message}
      </span>
    </div>
  );
}
