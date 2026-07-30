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
  DocumentStatusLabel,
  DocumentTypeLabel,
  GovernanceStatus,
  GovernanceStatusLabel,
  LifecycleStateLabel,
} from "@/features/projects/document-types";
import { errorDetail } from "@/features/projects/error";
import {
  useDocument,
  useDocumentPreview,
} from "@/features/projects/hooks/use-document";
import { useDeleteDocument } from "@/features/projects/hooks/use-document-mutations";
import { useMyProjectRole } from "@/features/projects/hooks/use-my-role";
import {
  canDeleteDocuments,
  canEditDocuments,
  canReleaseDocuments,
} from "@/features/projects/permissions";
import { buildDocumentView } from "@/features/projects/adapt-document";
import { DocumentGovernancePanel } from "@/features/projects/components/document-governance-panel";
import { useDocumentGovernance } from "@/features/projects/hooks/use-document-governance";
import { ReleaseDocumentDialog } from "@/features/projects/components/release-document-dialog";
import { StorySplitView } from "@/features/projects/components/story-split-view";
import { TestDocumentView } from "@/features/projects/components/test-document";
import { RuleDocumentView } from "@/features/business-rules/components/rule-document-view";
import { TddDocumentView } from "@/features/tdds/components/tdd-document-view";
import {
  ArrowLeftIcon,
  FileEditIcon,
  HistoryIcon,
  RocketIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

export default function ProjectDocumentDetailPage() {
  const { projectId = "", documentId = "" } = useParams();
  const navigate = useNavigate();

  const { document, isLoading, isError } = useDocument(documentId);
  const { data: governance } = useDocumentGovernance(documentId);
  const myRole = useMyProjectRole(projectId);
  const deleteDocument = useDeleteDocument();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releaseSuccess, setReleaseSuccess] = useState<string | null>(null);

  // Nội dung hiển thị đến thẳng từ response GET /documents/{id}. Chỉ khi adapter thất bại
  // (kind "raw") mới cần tới Markdown của /preview — nên query đó gần như không bao giờ chạy.
  const view = useMemo(() => buildDocumentView(document), [document]);
  const { previewMarkdown, isPreviewLoading } = useDocumentPreview(
    documentId,
    view.kind === "raw",
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Không tìm thấy tài liệu, hoặc bạn không có quyền truy cập.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          render={<Link to={`/projects/${projectId}/documents`} />}
        >
          <ArrowLeftIcon className="size-3.5" />
          Về danh sách tài liệu
        </Button>
      </div>
    );
  }

  const canEdit = !!myRole && canEditDocuments(myRole);
  const canDelete = !!myRole && canDeleteDocuments(myRole);
  const canRelease = !!myRole && canReleaseDocuments(myRole);

  const confirmDelete = () => {
    setDeleteError(null);
    deleteDocument.mutate(document.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        navigate(`/projects/${projectId}/documents`, { replace: true });
      },
      onError: (err) => {
        setDeleteError(errorDetail(err, "Không xoá được tài liệu."));
        setDeleteOpen(false);
      },
    });
  };

  const header = (
    <>
      <Link
        to={`/projects/${projectId}/documents`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeftIcon className="size-3.5" />
        Danh sách tài liệu
      </Link>

      {/* Header */}
      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {document.docKey}
            </span>
            <Badge variant="default" className="text-[10px]">
              {DocumentTypeLabel[document.docType]}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {DocumentStatusLabel[document.status] ?? document.status}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {LifecycleStateLabel[document.lifecycleState]}
            </Badge>
            {governance && (
              <Badge
                variant="outline"
                className="border-orange-300 bg-orange-50 text-[10px] text-orange-800"
              >
                {GovernanceStatusLabel[governance.status]}
              </Badge>
            )}
            {document.hasUnpublishedChanges && (
              <span className="text-[10px] text-primary">
                • có thay đổi chưa phát hành
              </span>
            )}
          </div>
          <h1 className="mt-1 text-xl font-semibold">
            {document.content.title}
          </h1>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Phiên bản {governance?.version ?? `v${document.currentVersionNumber}`}
            {document.content.ownerName && ` · ${document.content.ownerName}`}
          </p>
        </div>

        <div className="flex w-full flex-wrap justify-start gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
          {canEdit && (
            // Mọi loại tài liệu đều dùng trình soạn thảo section đầy đủ (đã gộp metadata).
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link
                  to={`/projects/${projectId}/documents/${document.id}/edit`}
                />
              }
            >
              <FileEditIcon className="size-3.5" />
              Sửa nội dung
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link
                to={`/projects/${projectId}/documents/${document.id}/versions`}
              />
            }
          >
            <HistoryIcon className="size-3.5" />
            Lịch sử phiên bản
          </Button>
          {canRelease && (
            <span
              title={
                document.hasUnpublishedChanges
                  ? undefined
                  : "Không có thay đổi nào để phát hành kể từ lần phát hành trước."
              }
            >
              <Button
                variant="outline"
                size="sm"
                disabled={
                  !document.hasUnpublishedChanges ||
                  governance?.status !== GovernanceStatus.Approved
                }
                onClick={() => setReleaseOpen(true)}
              >
                <RocketIcon className="size-3.5" />
                Phát hành
              </Button>
            </span>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon className="size-3.5" />
              Xoá
            </Button>
          )}
        </div>
          </div>

          {deleteError && (
            <p className="mt-3 text-xs text-destructive">{deleteError}</p>
          )}
          {releaseSuccess && (
            <p className="mt-3 text-xs text-primary">{releaseSuccess}</p>
          )}
        </div>
        <DocumentGovernancePanel
          documentId={document.id}
          canEdit={canEdit}
          canApprove={canRelease}
        />
      </div>
    </>
  );

  const dialogs = (
    <>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá tài liệu này?</AlertDialogTitle>
            <AlertDialogDescription>
              {document.docKey} — {document.content.title} sẽ bị xoá. Hành động
              này không thể hoàn tác.
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
              {deleteDocument.isPending && <Spinner />}
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReleaseDocumentDialog
        projectId={projectId}
        documentId={document.id}
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
        onReleased={(version) => {
          setReleaseOpen(false);
          setReleaseSuccess(
            `Đã phát hành phiên bản v${version.versionNumber}.`,
          );
        }}
      />
    </>
  );

  // US: chiếm trọn màn hình (header cố định trên, preview split-pane lấp đầy phần còn lại).
  if (view.kind === "story") {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border px-6 pb-3 pt-4">
          {header}
        </div>
        <div className="min-h-0 flex-1 p-4">
          <StorySplitView
            projectId={projectId}
            doc={document}
            storyHtml={view.html}
          />
        </div>
        {dialogs}
      </div>
    );
  }

  // Ghi chú là field mức tài liệu (documents.notes_md), không thuộc schema của loại nào —
  // nên render một chỗ ở đây thay vì nhét vào cả ba view. Trước đây nó không hiện ở đâu cả.
  const notes = document.content.notesMd?.trim();
  const notesBlock = notes ? (
    <div className="mt-8 border-t border-border pt-4">
      <h3 className="mb-2 text-xs font-semibold text-primary">Ghi chú</h3>
      <pre className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-foreground">
        {notes}
      </pre>
    </div>
  ) : null;

  // TDD/Rule: bố cục canh giữa như cũ.
  return (
    <div className="mx-auto max-w-5xl p-6">
      {header}
      <div className="mt-6">
        {view.kind === "tdd" ? (
          <>
            <TddDocumentView data={view.data} />
            {notesBlock}
          </>
        ) : view.kind === "rule" ? (
          <>
            <RuleDocumentView data={view.data} />
            {notesBlock}
          </>
        ) : view.kind === "test" ? (
          <>
            <TestDocumentView doc={document} />
            {notesBlock}
          </>
        ) : (
          <>
            <h2 className="mb-2 text-sm font-semibold text-primary">
              Xem trước
            </h2>
            {isPreviewLoading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : (
              <pre className="overflow-x-auto whitespace-pre-wrap border border-border/40 bg-muted/30 p-4 text-xs">
                {previewMarkdown ?? "Không có nội dung."}
              </pre>
            )}
          </>
        )}
      </div>
      {dialogs}
    </div>
  );
}
