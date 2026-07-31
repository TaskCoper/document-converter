import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  DocumentTypeLabel,
  type ReviewQueueRow,
} from "@/features/projects/document-types";
import { useReviewQueue } from "@/features/projects/hooks/use-review-queue";
import {
  ArrowRightIcon,
  ClipboardCheckIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

const formatDate = (value: string | null) => {
  if (!value) return "Chưa ghi nhận";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const roleLabel = (item: ReviewQueueRow) => {
  if (item.isReviewer && item.isApprover) return "Phản biện · Phê duyệt";
  if (item.isReviewer) return "Phản biện";
  return "Phê duyệt";
};

export default function ReviewQueuePage() {
  const { projectId } = useParams<{ projectId?: string }>();
  const scope = projectId ?? "all-projects";
  const [pages, setPages] = useState<Record<string, number>>({});
  const page = pages[scope] ?? 1;
  const setPage = (next: (current: number) => number) => {
    setPages((current) => ({
      ...current,
      [scope]: next(current[scope] ?? 1),
    }));
  };
  const queue = useReviewQueue(projectId, page);

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <header>
        <div className="flex items-center gap-2">
          <ClipboardCheckIcon className="size-5 text-primary" />
          <h1 className="text-lg font-semibold text-primary">
            Tài liệu cần duyệt
          </h1>
        </div>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
          {projectId
            ? "Các tài liệu trong dự án này đang chờ bạn phản biện hoặc phê duyệt."
            : "Tổng hợp tài liệu đang chờ bạn phản biện hoặc phê duyệt từ tất cả dự án."}
        </p>
      </header>

      <section aria-live="polite" className="mt-5">
        {queue.noBackend ? (
          <EmptyMessage message="Chưa cấu hình backend để tải hàng đợi duyệt." />
        ) : queue.isLoading ? (
          <div
            className="flex min-h-40 items-center justify-center"
            role="status"
            aria-label="Đang tải tài liệu cần duyệt"
          >
            <Spinner />
          </div>
        ) : queue.isError ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-xs text-destructive">
              Không tải được tài liệu cần duyệt.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queue.refetch()}
            >
              <RefreshCwIcon className="size-3.5" />
              Thử lại
            </Button>
          </div>
        ) : queue.items.length === 0 ? (
          <EmptyMessage message="Hiện không có tài liệu nào đang chờ bạn duyệt." />
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
              <span>{queue.totalCount} tài liệu</span>
              {queue.isFetching && <span>Đang cập nhật…</span>}
            </div>

            <div className="hidden overflow-x-auto border border-border/50 md:block">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-muted/60 text-left">
                  <tr>
                    {!projectId && <TableHead>Dự án</TableHead>}
                    <TableHead>Tài liệu</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Vai trò của bạn</TableHead>
                    <TableHead>Phiên bản</TableHead>
                    <TableHead>Gửi duyệt</TableHead>
                    <th className="w-10 border-b border-border/50 p-2">
                      <span className="sr-only">Mở tài liệu</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {queue.items.map((item) => (
                    <tr key={item.id} className="hover:bg-primary/5">
                      {!projectId && (
                        <TableCell>
                          <span className="block font-medium">
                            {item.projectName}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {item.projectCode}
                          </span>
                        </TableCell>
                      )}
                      <TableCell>
                        <Link
                          to={`/projects/${item.projectId}/documents/${item.id}`}
                          className="block font-medium hover:text-primary hover:underline"
                        >
                          {item.title}
                        </Link>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {item.docKey}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {DocumentTypeLabel[item.docType]}
                        </Badge>
                      </TableCell>
                      <TableCell>{roleLabel(item)}</TableCell>
                      <TableCell>{item.version}</TableCell>
                      <TableCell>{formatDate(item.submittedAt)}</TableCell>
                      <TableCell>
                        <Link
                          to={`/projects/${item.projectId}/documents/${item.id}`}
                          className="inline-flex size-7 items-center justify-center text-muted-foreground hover:bg-muted hover:text-primary"
                          aria-label={`Mở ${item.docKey}`}
                        >
                          <ArrowRightIcon className="size-3.5" />
                        </Link>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 md:hidden">
              {queue.items.map((item) => (
                <Link
                  key={item.id}
                  to={`/projects/${item.projectId}/documents/${item.id}`}
                  className="block border border-border/60 bg-background p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {!projectId && (
                        <p className="truncate text-[10px] text-muted-foreground">
                          {item.projectName}
                        </p>
                      )}
                      <p className="mt-0.5 line-clamp-2 text-sm font-medium">
                        {item.title}
                      </p>
                    </div>
                    <ArrowRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-mono">{item.docKey}</span>
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                      {DocumentTypeLabel[item.docType]}
                    </Badge>
                    <span>{roleLabel(item)}</span>
                    <span>{formatDate(item.submittedAt)}</span>
                  </div>
                </Link>
              ))}
            </div>

            {(queue.hasPreviousPage || queue.hasNextPage) && (
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!queue.hasPreviousPage || queue.isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Trang trước
                </Button>
                <span className="min-w-14 text-center text-[11px] text-muted-foreground">
                  Trang {queue.pageIndex}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!queue.hasNextPage || queue.isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Trang sau
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-3 border border-dashed border-border bg-muted/10 p-6 text-center">
      <span className="flex size-10 items-center justify-center bg-muted text-muted-foreground">
        <ClipboardCheckIcon className="size-5" />
      </span>
      <p className="max-w-sm text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-r border-border/50 p-2 font-medium last:border-r-0">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="border-b border-r border-border/40 p-2 align-top last:border-r-0">
      {children}
    </td>
  );
}
