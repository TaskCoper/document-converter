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
import { PlayIcon, RotateCcwIcon } from "lucide-react";
import { useState } from "react";
import { errorDetail } from "../error";
import { useRetryPublishJob, useRunPublishCycle } from "../hooks/use-publish-job-mutations";
import { usePublishJobs } from "../hooks/use-publish-jobs";
import type { PublishCycleResult, PublishJobRow } from "../repository-types";
import { PublishStatus, PublishStatusLabel } from "../repository-types";

const PUBLISH_STATUS_BADGE: Record<
  PublishStatus,
  "outline" | "secondary" | "default" | "destructive"
> = {
  [PublishStatus.Pending]: "outline",
  [PublishStatus.Running]: "secondary",
  [PublishStatus.Succeeded]: "default",
  [PublishStatus.Failed]: "destructive",
  [PublishStatus.Cancelled]: "outline",
};

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("vi-VN");
  } catch {
    return iso;
  }
};

export function PublishJobsSection({ projectId }: { projectId: string }) {
  const { jobs, isLoading, isError } = usePublishJobs(projectId);
  const retryJob = useRetryPublishJob(projectId);
  const runCycle = useRunPublishCycle(projectId);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<Record<string, string>>({});
  const [runOpen, setRunOpen] = useState(false);
  const [runResult, setRunResult] = useState<PublishCycleResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const runRetry = (job: PublishJobRow) => {
    setBusyId(job.jobId);
    setRetryError((prev) => ({ ...prev, [job.jobId]: "" }));
    retryJob.mutate(job.jobId, {
      onError: (err) =>
        setRetryError((prev) => ({
          ...prev,
          [job.jobId]: errorDetail(err, "Không xếp lại job được."),
        })),
      onSettled: () => setBusyId(null),
    });
  };

  const confirmRun = () => {
    setRunError(null);
    runCycle.mutate(undefined, {
      onSuccess: (result) => {
        setRunResult(result);
        setRunOpen(false);
      },
      onError: (err) => {
        setRunError(errorDetail(err, "Chạy publish thất bại."));
        setRunOpen(false);
      },
    });
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-primary">
            Hàng đợi Publish ({jobs.length})
          </h2>
          <p className="text-[10px] text-muted-foreground">
            Job được tạo mỗi khi phát hành tài liệu (1 job/kho GitHub). Worker
            phía backend tự xử lý định kỳ — dùng "Chạy ngay" để không phải
            chờ.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setRunOpen(true)}>
          <PlayIcon className="size-3.5" />
          Chạy ngay
        </Button>
      </div>

      {runResult && (
        <div className="mt-3 border border-border/40 bg-muted/20 p-2 text-[10px] text-muted-foreground">
          Đã xử lý {runResult.claimed} job — {runResult.published} thành
          công, {runResult.skippedIdentical} giống hệt (bỏ qua),{" "}
          {runResult.deferred} hoãn lại, {runResult.failed} lỗi.
          {runResult.errors.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-destructive">
              {runResult.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {runError && (
        <p className="mt-3 text-xs text-destructive">{runError}</p>
      )}

      <div className="mt-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-xs text-destructive">
            Không tải được hàng đợi publish.
          </p>
        ) : jobs.length === 0 ? (
          <div className="border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
            Chưa có job publish nào — job được tạo khi bạn phát hành tài
            liệu.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border/40">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-muted/60">
                <tr>
                  <th className="border border-border/40 px-2 py-1.5 text-left font-medium">
                    Tài liệu
                  </th>
                  <th className="w-40 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Kho
                  </th>
                  <th className="border border-border/40 px-2 py-1.5 text-left font-medium">
                    File
                  </th>
                  <th className="w-24 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Trạng thái
                  </th>
                  <th className="w-16 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Số lần thử
                  </th>
                  <th className="w-36 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Thời gian
                  </th>
                  <th className="w-20 border border-border/40 px-2 py-1.5 text-right font-medium">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const isBusy = busyId === job.jobId;
                  const canRetry =
                    job.status === PublishStatus.Failed ||
                    job.status === PublishStatus.Cancelled;
                  return (
                    <tr key={job.jobId} className="hover:bg-primary/5">
                      <td className="border border-border/40 px-2 py-1.5 align-top">
                        <div className="font-mono">
                          {job.docKey} · v{job.versionNumber}
                          {job.versionLabel && ` · ${job.versionLabel}`}
                        </div>
                        {job.lastError && (
                          <div
                            className="mt-0.5 truncate text-[10px] text-destructive"
                            title={job.lastError}
                          >
                            {job.lastError}
                          </div>
                        )}
                        {retryError[job.jobId] && (
                          <div className="mt-0.5 text-[10px] text-destructive">
                            {retryError[job.jobId]}
                          </div>
                        )}
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top font-mono text-muted-foreground">
                        {job.repositoryFullName}
                      </td>
                      <td
                        className="max-w-48 truncate border border-border/40 px-2 py-1.5 align-top font-mono text-muted-foreground"
                        title={job.filePath}
                      >
                        {job.filePath}
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top">
                        <Badge
                          variant={PUBLISH_STATUS_BADGE[job.status]}
                          className="text-[10px]"
                        >
                          {PublishStatusLabel[job.status]}
                        </Badge>
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
                        {job.attemptCount}
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
                        {formatDateTime(
                          job.completedAt ??
                            job.nextAttemptAt ??
                            job.createdAt,
                        )}
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top">
                        {canRetry && (
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2"
                              disabled={isBusy}
                              onClick={() => runRetry(job)}
                              title="Xếp lại job"
                            >
                              {isBusy && retryJob.isPending ? (
                                <Spinner className="size-3" />
                              ) : (
                                <RotateCcwIcon className="size-3" />
                              )}
                              Thử lại
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={runOpen} onOpenChange={setRunOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chạy publish ngay?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này xử lý hàng đợi publish của TOÀN HỆ THỐNG (mọi
              project, không riêng project này), đẩy các job đang chờ lên
              GitHub ngay lập tức thay vì chờ worker chạy định kỳ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRun();
              }}
            >
              {runCycle.isPending && <Spinner />}
              Chạy ngay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
