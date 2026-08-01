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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { CreateDocumentDialog } from "@/features/projects/components/create-document-dialog";
import {
  ApprovalState,
  ApprovalStateLabel,
  DocumentType,
  DocumentTypeLabel,
  StoryWorkStateLabel,
  StoryPriorityLabel,
  type DocumentListRow,
} from "@/features/projects/document-types";
import { errorDetail } from "@/features/projects/error";
import {
  useDeleteDocument,
  useDuplicateDocument,
} from "@/features/projects/hooks/use-document-mutations";
import { useDocuments } from "@/features/projects/hooks/use-documents";
import { useMyProjectRole } from "@/features/projects/hooks/use-my-role";
import {
  canDeleteDocuments,
  canEditDocuments,
} from "@/features/projects/permissions";
import {
  ArrowLeftIcon,
  CopyIcon,
  EyeIcon,
  FileTextIcon,
  NetworkIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const TYPE_TABS: { label: string; value: DocumentType | undefined }[] = [
  { label: "Tất cả", value: undefined },
  { label: "User Story", value: DocumentType.UserStory },
  { label: "TDD", value: DocumentType.Tdd },
  { label: "Business Rule", value: DocumentType.BusinessRule },
  { label: "Unit Test", value: DocumentType.UnitTest },
  { label: "System Test", value: DocumentType.SystemTest },
];

const TYPE_BADGE: Record<DocumentType, "default" | "secondary" | "outline"> = {
  [DocumentType.UserStory]: "default",
  [DocumentType.Tdd]: "secondary",
  [DocumentType.BusinessRule]: "outline",
  [DocumentType.UnitTest]: "secondary",
  [DocumentType.SystemTest]: "outline",
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
};

export default function ProjectDocumentsPage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const myRole = useMyProjectRole(projectId);
  const canEdit = !!myRole && canEditDocuments(myRole);
  const canDelete = !!myRole && canDeleteDocuments(myRole);
  const canCreate = canEdit;
  const deleteDocument = useDeleteDocument();
  const duplicateDocument = useDuplicateDocument();

  const [docType, setDocType] = useState<DocumentType | undefined>(undefined);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sprintInput, setSprintInput] = useState("");
  const [sprint, setSprint] = useState<number | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentListRow | null>(
    null,
  );
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { documents, totalCount, isLoading, isFetching, isError } =
    useDocuments(projectId, { docType, keyword, sprint });

  const duplicate = (doc: DocumentListRow) => {
    setActionError(null);
    setDuplicatingId(doc.id);
    duplicateDocument.mutate(doc.id, {
      onSuccess: (created) => {
        navigate(`/projects/${projectId}/documents/${created.id}/edit`);
      },
      onError: (error) => {
        setActionError(errorDetail(error, "Không nhân bản được tài liệu."));
      },
      onSettled: () => setDuplicatingId(null),
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    setActionError(null);
    deleteDocument.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (error) => {
        setActionError(errorDetail(error, "Không xoá được tài liệu."));
        setDeleteTarget(null);
      },
    });
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <Link
        to={`/projects`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeftIcon className="size-3.5" />
        Về dự án
      </Link>

      <div className="mt-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-primary">Tài liệu</h1>
          <p className="text-xs text-muted-foreground">
            User Story, TDD, Business Rule và test case của dự án — lấy từ backend.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {isFetching && <Spinner className="size-4" />}
          {myRole && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link to={`/projects/${projectId}/graph`} />}
            >
              <NetworkIcon className="size-3.5" />
              Đồ thị
            </Button>
          )}
          {myRole && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link to={`/projects/${projectId}`} />}
            >
              <SettingsIcon className="size-3.5" />
              Cấu hình
            </Button>
          )}
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-3.5" />
              Tạo tài liệu
            </Button>
          )}
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {TYPE_TABS.map((tab) => (
            <Button
              key={tab.label}
              type="button"
              size="sm"
              variant={docType === tab.value ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setDocType(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <form
            className="flex shrink-0 items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              setSprint(sprintInput ? Number(sprintInput) : undefined);
            }}
          >
            <Input
              id="sprint-filter"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              aria-label="Lọc theo sprint"
              value={sprintInput}
              onChange={(e) => {
                const nextValue = e.target.value;
                if (nextValue === "" || /^[1-9]\d*$/.test(nextValue)) {
                  setSprintInput(nextValue);
                }
              }}
              placeholder="Sprint"
              className="h-8 w-24 text-xs"
            />
            <Button
              type="submit"
              size="sm"
              variant={sprint == null ? "outline" : "default"}
              className="h-8 px-2.5 text-xs"
            >
              Lọc
            </Button>
          </form>
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <SearchIcon className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setKeyword(e.currentTarget.value.trim());
                }
              }}
              placeholder="Tìm tiêu đề / mã, Enter để tìm"
              spellCheck={false}
              autoComplete="off"
              className="h-8 w-full pl-7 text-xs sm:w-64"
            />
          </div>
        </div>
      </div>

      <div className="mt-3">
        {actionError && (
          <p className="mb-2 text-xs text-destructive">{actionError}</p>
        )}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : isError ? (
          <p className="py-12 text-center text-xs text-destructive">
            Không tải được danh sách tài liệu.
          </p>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-dashed border-border py-12 text-center">
            <FileTextIcon className="size-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {keyword || docType || sprint
                ? "Không có tài liệu khớp bộ lọc."
                : "Dự án chưa có tài liệu nào."}
            </p>
          </div>
        ) : (
          <>
            <DocumentMobileList
              documents={documents}
              projectId={projectId}
              canEdit={canEdit}
              canDelete={canDelete}
              duplicatingId={duplicatingId}
              onDuplicate={duplicate}
              onDelete={setDeleteTarget}
            />
            <div className="hidden overflow-x-auto border border-border/40 md:block">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="w-32 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Mã
                    </th>
                    <th className="w-28 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Loại
                    </th>
                    <th className="border border-border/40 px-2 py-1.5 text-left font-medium">
                      Tiêu đề
                    </th>
                    <th className="w-20 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Sprint
                    </th>
                    <th className="w-28 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Tiến độ
                    </th>
                    <th className="w-24 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Phê duyệt
                    </th>
                    <th className="w-16 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Bản
                    </th>
                    <th className="w-32 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Chủ sở hữu
                    </th>
                    <th className="w-24 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Cập nhật
                    </th>
                    <th className="w-28 border border-border/40 px-2 py-1.5 text-center font-medium">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      doc={doc}
                      onOpen={() =>
                        navigate(`/projects/${projectId}/documents/${doc.id}`)
                      }
                      onEdit={() =>
                        navigate(
                          `/projects/${projectId}/documents/${doc.id}/edit`,
                        )
                      }
                      onDuplicate={() => duplicate(doc)}
                      onDelete={() => setDeleteTarget(doc)}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      isDuplicating={duplicatingId === doc.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {totalCount} tài liệu
            </p>
          </>
        )}
      </div>

      <CreateDocumentDialog
        projectId={projectId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(doc) => {
          setCreateOpen(false);
          // TDD/Business Rule: đi thẳng vào wizard soạn nội dung (vừa tạo chỉ có tiêu đề).
          // User Story: giữ hành vi cũ, vào trang chi tiết trước.
          const suffix = doc.docType === DocumentType.UserStory ? "" : "/edit";
          navigate(`/projects/${projectId}/documents/${doc.id}${suffix}`);
        }}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteDocument.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá tài liệu này?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.docKey} — {deleteTarget?.title} sẽ bị xoá. Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDocument.isPending}>
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteDocument.isPending}
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
            >
              {deleteDocument.isPending && <Spinner />}
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DocumentMobileList({
  documents,
  projectId,
  canEdit,
  canDelete,
  duplicatingId,
  onDuplicate,
  onDelete,
}: {
  documents: DocumentListRow[];
  projectId: string;
  canEdit: boolean;
  canDelete: boolean;
  duplicatingId: string | null;
  onDuplicate: (doc: DocumentListRow) => void;
  onDelete: (doc: DocumentListRow) => void;
}) {
  const navigate = useNavigate();

  return (
    <ul className="divide-y divide-border/40 border border-border/40 md:hidden">
      {documents.map((doc) => (
        <li key={doc.id} className="px-3 py-2.5">
          <Link
            to={`/projects/${projectId}/documents/${doc.id}`}
            className="block transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <div className="flex min-w-0 items-start justify-between gap-2">
              <code className="truncate font-mono text-[10px] text-muted-foreground">
                {doc.docKey}
              </code>
              <Badge
                variant={TYPE_BADGE[doc.docType]}
                className="shrink-0 text-[10px]"
              >
                {DocumentTypeLabel[doc.docType]}
              </Badge>
            </div>

            <p className="mt-1 break-words text-xs font-medium">{doc.title}</p>
            {doc.summary && (
              <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
                {doc.summary}
              </p>
            )}

            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
              <div className="min-w-0">
                <dt className="text-muted-foreground">Tiến độ</dt>
                <dd className="truncate">
                  {doc.storyWorkState
                    ? StoryWorkStateLabel[doc.storyWorkState]
                    : "—"}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">Phê duyệt</dt>
                <dd className="truncate">
                  {doc.isArchived
                    ? "Lưu trữ"
                    : ApprovalStateLabel[doc.approvalState]}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">Sprint / bản</dt>
                <dd className="truncate">
                  {doc.sprint != null ? `S${doc.sprint}` : "—"} · v
                  {doc.currentVersionNumber}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">Cập nhật</dt>
                <dd className="truncate">
                  {formatDate(doc.updatedAt ?? doc.createdAt)}
                </dd>
              </div>
            </dl>

            {doc.hasUnpublishedChanges && (
              <p className="mt-1.5 text-[10px] text-primary">
                Có thay đổi chưa phát hành
              </p>
            )}
          </Link>
          <div className="mt-2 border-t border-border/40 pt-2">
            <DocumentActions
              doc={doc}
              canEdit={canEdit}
              canDelete={canDelete}
              isDuplicating={duplicatingId === doc.id}
              onView={() =>
                navigate(`/projects/${projectId}/documents/${doc.id}`)
              }
              onEdit={() =>
                navigate(`/projects/${projectId}/documents/${doc.id}/edit`)
              }
              onDuplicate={() => onDuplicate(doc)}
              onDelete={() => onDelete(doc)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function DocumentRow({
  doc,
  onOpen,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canDelete,
  isDuplicating,
}: {
  doc: DocumentListRow;
  onOpen: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
  isDuplicating: boolean;
}) {
  return (
    <tr className="cursor-pointer hover:bg-primary/5" onClick={onOpen}>
      <td className="border border-border/40 px-2 py-1.5 align-top font-mono text-muted-foreground">
        {doc.docKey}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top">
        <Badge variant={TYPE_BADGE[doc.docType]} className="text-[10px]">
          {DocumentTypeLabel[doc.docType]}
        </Badge>
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top">
        <div className="font-medium">{doc.title}</div>
        {doc.summary && (
          <div className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground/80">
            {doc.summary}
          </div>
        )}
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          {doc.priority != null && (
            <span>{StoryPriorityLabel[doc.priority]}</span>
          )}
          {doc.category && <span>· {doc.category}</span>}
          {doc.effectiveDate && (
            <span>· Hiệu lực {formatDate(doc.effectiveDate)}</span>
          )}
          {doc.hasUnpublishedChanges && (
            <span className="text-primary">· có thay đổi chưa phát hành</span>
          )}
        </div>
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
        {doc.sprint != null ? `S${doc.sprint}` : "—"}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top">
        {doc.storyWorkState ? (
          <Badge variant="secondary" className="text-[10px]">
            {StoryWorkStateLabel[doc.storyWorkState]}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
        {doc.isArchived
          ? "Lưu trữ"
          : ApprovalStateLabel[doc.approvalState]}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
        v{doc.currentVersionNumber}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
        {doc.ownerName || "—"}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
        {formatDate(doc.updatedAt ?? doc.createdAt)}
      </td>
      <td className="border border-border/40 px-1 py-1 align-top">
        <DocumentActions
          doc={doc}
          canEdit={canEdit}
          canDelete={canDelete}
          isDuplicating={isDuplicating}
          onView={onOpen}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}

function DocumentActions({
  doc,
  canEdit,
  canDelete,
  isDuplicating,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  doc: DocumentListRow;
  canEdit: boolean;
  canDelete: boolean;
  isDuplicating: boolean;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const canEditCurrent =
    canEdit &&
    !doc.isArchived &&
    doc.approvalState !== ApprovalState.Approved;

  return (
    <div
      className="flex items-center justify-center gap-0.5"
      onClick={(event) => event.stopPropagation()}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        title="Xem"
        aria-label={`Xem ${doc.docKey}`}
        onClick={onView}
      >
        <EyeIcon />
      </Button>
      {canEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          title={
            canEditCurrent
              ? "Sửa"
              : "Tài liệu đã duyệt hoặc lưu trữ; mở tài liệu để bắt đầu bản sửa đổi"
          }
          aria-label={`Sửa ${doc.docKey}`}
          disabled={!canEditCurrent}
          onClick={onEdit}
        >
          <PencilIcon />
        </Button>
      )}
      {canEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          title="Nhân bản"
          aria-label={`Nhân bản ${doc.docKey}`}
          disabled={isDuplicating}
          onClick={onDuplicate}
        >
          {isDuplicating ? <Spinner className="size-3" /> : <CopyIcon />}
        </Button>
      )}
      {canDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-destructive hover:text-destructive"
          title="Xoá"
          aria-label={`Xoá ${doc.docKey}`}
          onClick={onDelete}
        >
          <Trash2Icon />
        </Button>
      )}
    </div>
  );
}
