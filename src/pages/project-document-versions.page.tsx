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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { NumberSelect } from "@/features/projects/components/number-select";
import { DiffChangeKindLabel, type VersionListRow } from "@/features/projects/document-types";
import { errorDetail } from "@/features/projects/error";
import { useDocument } from "@/features/projects/hooks/use-document";
import {
  useVersionDiff,
  useVersionMarkdown,
  useVersions,
} from "@/features/projects/hooks/use-document-versions";
import { useMyProjectRole } from "@/features/projects/hooks/use-my-role";
import { useRestoreVersion } from "@/features/projects/hooks/use-release-mutations";
import { canEditDocuments } from "@/features/projects/permissions";
import {
  ArrowLeftIcon,
  FileTextIcon,
  GitCompareIcon,
  HistoryIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("vi-VN");
  } catch {
    return iso;
  }
};

export default function ProjectDocumentVersionsPage() {
  const { projectId = "", documentId = "" } = useParams();
  const { document } = useDocument(documentId);
  const myRole = useMyProjectRole(projectId);
  const { versions, isLoading, isError } = useVersions(documentId);

  const [markdownVersion, setMarkdownVersion] = useState<number | null>(null);
  const [diffRange, setDiffRange] = useState<{ from: number; to: number } | null>(
    null,
  );
  const [compareFrom, setCompareFrom] = useState<number | null>(null);
  const [compareTo, setCompareTo] = useState<number | null>(null);
  const [restoreVersionNumber, setRestoreVersionNumber] = useState<number | null>(
    null,
  );
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  const canRestore = !!myRole && canEditDocuments(myRole);
  const restoreVersion = useRestoreVersion(projectId, documentId);

  const versionOptions = versions.map((v) => ({
    value: v.versionNumber,
    label: `v${v.versionNumber}${v.versionLabel ? ` · ${v.versionLabel}` : ""}`,
  }));

  const confirmRestore = () => {
    if (restoreVersionNumber == null) return;
    setRestoreError(null);
    restoreVersion.mutate(restoreVersionNumber, {
      onSuccess: () => {
        setRestoreSuccess(
          `Đã khôi phục nội dung v${restoreVersionNumber} vào bản nháp. Vào trang tài liệu để xem/sửa, và phát hành lại nếu muốn đưa lên GitHub.`,
        );
        setRestoreVersionNumber(null);
      },
      onError: (err) => {
        setRestoreError(errorDetail(err, "Không khôi phục được phiên bản."));
        setRestoreVersionNumber(null);
      },
    });
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Link
        to={`/projects/${projectId}/documents/${documentId}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeftIcon className="size-3.5" />
        Về tài liệu
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <HistoryIcon className="size-4 text-primary" />
        <h1 className="text-xl font-semibold">
          Lịch sử phiên bản
          {document && (
            <span className="ml-2 font-mono text-sm text-muted-foreground">
              {document.docKey} · {document.content.title}
            </span>
          )}
        </h1>
      </div>

      {restoreSuccess && (
        <p className="mt-3 text-xs text-primary">{restoreSuccess}</p>
      )}
      {restoreError && (
        <p className="mt-3 text-xs text-destructive">{restoreError}</p>
      )}

      {versions.length > 1 && (
        <div className="mt-4 flex flex-wrap items-end gap-2 border border-border/40 bg-muted/20 p-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">
              Từ phiên bản
            </span>
            <NumberSelect
              value={compareFrom}
              onChange={setCompareFrom}
              options={versionOptions}
              placeholder="Chọn"
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">
              Đến phiên bản
            </span>
            <NumberSelect
              value={compareTo}
              onChange={setCompareTo}
              options={versionOptions}
              placeholder="Chọn"
              className="w-40"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={compareFrom == null || compareTo == null}
            onClick={() =>
              compareFrom != null &&
              compareTo != null &&
              setDiffRange({ from: compareFrom, to: compareTo })
            }
          >
            <GitCompareIcon className="size-3.5" />
            So sánh
          </Button>
        </div>
      )}

      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : isError ? (
          <p className="py-12 text-center text-xs text-destructive">
            Không tải được lịch sử phiên bản.
          </p>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-dashed border-border py-12 text-center">
            <HistoryIcon className="size-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Tài liệu này chưa được phát hành lần nào.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border/40">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-muted/60">
                <tr>
                  <th className="w-14 border border-border/40 px-2 py-1.5 text-left font-medium">
                    #
                  </th>
                  <th className="w-28 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Nhãn
                  </th>
                  <th className="border border-border/40 px-2 py-1.5 text-left font-medium">
                    Tóm tắt thay đổi
                  </th>
                  <th className="w-32 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Người tạo
                  </th>
                  <th className="w-36 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Ngày tạo
                  </th>
                  <th className="w-20 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Publish
                  </th>
                  <th className="w-32 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v, i) => {
                  const previous = versions[i + 1]; // desc order → phần tử kế tiếp là bản cũ hơn
                  return (
                    <VersionRow
                      key={v.versionNumber}
                      version={v}
                      canRestore={canRestore}
                      onViewMarkdown={() => setMarkdownVersion(v.versionNumber)}
                      onCompareWithPrevious={
                        previous
                          ? () =>
                              setDiffRange({
                                from: previous.versionNumber,
                                to: v.versionNumber,
                              })
                          : undefined
                      }
                      onRestore={() => setRestoreVersionNumber(v.versionNumber)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MarkdownDialog
        documentId={documentId}
        versionNumber={markdownVersion}
        onOpenChange={(open) => !open && setMarkdownVersion(null)}
      />

      <DiffDialog
        documentId={documentId}
        range={diffRange}
        onOpenChange={(open) => !open && setDiffRange(null)}
      />

      <AlertDialog
        open={restoreVersionNumber != null}
        onOpenChange={(open) => !open && setRestoreVersionNumber(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Khôi phục v{restoreVersionNumber} vào bản nháp?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Nội dung của phiên bản này sẽ được nạp lại vào bản nháp, ghi đè
              nội dung nháp hiện tại. Bản đang publish trên GitHub KHÔNG đổi
              cho tới khi bạn chủ động phát hành lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRestore();
              }}
            >
              {restoreVersion.isPending && <Spinner />}
              Khôi phục
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function VersionRow({
  version,
  canRestore,
  onViewMarkdown,
  onCompareWithPrevious,
  onRestore,
}: {
  version: VersionListRow;
  canRestore: boolean;
  onViewMarkdown: () => void;
  onCompareWithPrevious?: () => void;
  onRestore: () => void;
}) {
  return (
    <tr>
      <td className="border border-border/40 px-2 py-1.5 align-top font-mono text-muted-foreground">
        v{version.versionNumber}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top">
        {version.versionLabel || "—"}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top">
        {version.changeSummary ? (
          <span className="line-clamp-2">{version.changeSummary}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
        {version.createdByName || "—"}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
        {formatDateTime(version.createdAt)}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top">
        <Badge variant={version.publishedCount >= version.publishJobCount && version.publishJobCount > 0 ? "default" : "secondary"} className="text-[10px]">
          {version.publishedCount}/{version.publishJobCount}
        </Badge>
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top">
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5"
            title="Xem markdown"
            onClick={onViewMarkdown}
          >
            <FileTextIcon className="size-3.5" />
          </Button>
          {onCompareWithPrevious && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5"
              title="So sánh với bản trước"
              onClick={onCompareWithPrevious}
            >
              <GitCompareIcon className="size-3.5" />
            </Button>
          )}
          {canRestore && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5"
              title="Khôi phục vào bản nháp"
              onClick={onRestore}
            >
              <RotateCcwIcon className="size-3.5" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function MarkdownDialog({
  documentId,
  versionNumber,
  onOpenChange,
}: {
  documentId: string;
  versionNumber: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { markdown, isLoading } = useVersionMarkdown(
    documentId,
    versionNumber ?? undefined,
  );
  return (
    <Dialog open={versionNumber != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Markdown — v{versionNumber}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap border border-border/40 bg-muted/30 p-4 text-xs">
            {markdown ?? "Không có nội dung."}
          </pre>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DiffDialog({
  documentId,
  range,
  onOpenChange,
}: {
  documentId: string;
  range: { from: number; to: number } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { diff, isLoading, isError } = useVersionDiff(
    documentId,
    range?.from,
    range?.to,
  );
  return (
    <Dialog open={range != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            So sánh v{range?.from} → v{range?.to}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-xs text-destructive">
            Không so sánh được 2 phiên bản này.
          </p>
        ) : diff?.contentIdentical ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Hai phiên bản giống hệt nội dung.
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            {diff?.changes.map((change, i) => (
              <div
                key={`${change.path}-${i}`}
                className="border-b border-border/40 py-1.5 text-xs last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {change.path}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      "text-[9px] " +
                      (change.kind === 1
                        ? "text-primary"
                        : change.kind === 2
                          ? "text-destructive"
                          : "text-muted-foreground")
                    }
                  >
                    {DiffChangeKindLabel[change.kind]}
                  </Badge>
                </div>
                <div className="mt-0.5 flex flex-col gap-0.5">
                  {change.oldValue != null && (
                    <span className="text-muted-foreground line-through">
                      {change.oldValue}
                    </span>
                  )}
                  {change.newValue != null && <span>{change.newValue}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
