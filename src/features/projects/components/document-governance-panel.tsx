import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import documentService, {
  type UpdateGovernanceBody,
} from "@/features/projects/document-services";
import {
  type DocumentGovernance,
  type GovernanceParticipant,
  ApprovalState,
  ApprovalStateLabel,
} from "@/features/projects/document-types";
import { errorDetail } from "@/features/projects/error";
import { useDocumentGovernance } from "@/features/projects/hooks/use-document-governance";
import { projectKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  ChevronDownIcon,
  CircleArrowOutUpRightIcon,
  PencilIcon,
  RotateCcwIcon,
  SaveIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";

type GovernanceAction =
  | "submit-review"
  | "request-changes"
  | "approve"
  | "start-revision";

interface GovernanceForm {
  version: string;
  authorName: string;
  reviewerName: string;
  approverName: string;
  ownerName: string;
}

const emptyForm: GovernanceForm = {
  version: "",
  authorName: "",
  reviewerName: "",
  approverName: "",
  ownerName: "",
};

const statusClass: Record<number, string> = {
  [ApprovalState.Draft]:
    "border-border bg-muted/50 text-foreground",
  [ApprovalState.InReview]:
    "border-primary/40 bg-primary/10 text-primary",
  [ApprovalState.Approved]:
    "border-primary bg-primary text-primary-foreground",
};

export function DocumentGovernancePanel({
  documentId,
  canEdit,
  canApprove,
  onRevisionStarted,
  allowMetadataEditing = false,
}: {
  documentId: string;
  canEdit: boolean;
  canApprove: boolean;
  onRevisionStarted?: () => void;
  allowMetadataEditing?: boolean;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useDocumentGovernance(documentId);
  const [editing, setEditing] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [form, setForm] = useState<GovernanceForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: projectKeys.documentGovernance(documentId),
      }),
      queryClient.invalidateQueries({
        queryKey: projectKeys.document(documentId),
      }),
      queryClient.invalidateQueries({
        queryKey: projectKeys.reviewQueues(),
      }),
    ]);
  };

  const update = useMutation({
    mutationFn: (body: UpdateGovernanceBody) =>
      documentService.updateGovernance(documentId, body),
    onSuccess: async () => {
      setEditing(false);
      setMessage("Đã lưu metadata tài liệu.");
      await refresh();
    },
    onError: (error) => {
      setMessage(errorDetail(error, "Không lưu được metadata tài liệu."));
    },
  });

  const transition = useMutation({
    mutationFn: (action: GovernanceAction) =>
      documentService.transitionGovernance(documentId, action),
    onSuccess: async (result, action) => {
      setMessage(
        `Đã chuyển trạng thái sang ${ApprovalStateLabel[result.status]}.`,
      );
      await refresh();
      if (action === "start-revision") {
        onRevisionStarted?.();
      }
    },
    onError: (error) => {
      setMessage(errorDetail(error, "Không chuyển được trạng thái tài liệu."));
    },
  });

  const archive = useMutation({
    mutationFn: (shouldArchive: boolean) =>
      shouldArchive
        ? documentService.archive(documentId)
        : documentService.unarchive(documentId),
    onSuccess: async (_, shouldArchive) => {
      setMessage(
        shouldArchive
          ? "Đã lưu trữ tài liệu."
          : "Đã đưa tài liệu ra khỏi kho lưu trữ.",
      );
      await refresh();
    },
    onError: (error) => {
      setMessage(errorDetail(error, "Không thay đổi được trạng thái lưu trữ."));
    },
  });

  if (isLoading) {
    return (
      <aside className="flex min-h-12 w-full items-center justify-center border border-border bg-background px-3 py-2">
        <Spinner />
      </aside>
    );
  }

  if (isError || !data) {
    return (
      <aside className="w-full border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
        Không tải được thông tin phê duyệt.
      </aside>
    );
  }

  const locked = data.status === ApprovalState.Approved || data.isArchived;
  const isPending =
    update.isPending || transition.isPending || archive.isPending;

  const change = (field: keyof GovernanceForm, value: string) => {
    setMessage(null);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = () => {
    setMessage(null);
    update.mutate({
      version: form.version,
      authorId: retainedParticipantId(data.author, form.authorName),
      reviewerId: retainedParticipantId(data.reviewer, form.reviewerName),
      approverId: retainedParticipantId(data.approver, form.approverName),
      ownerId: retainedParticipantId(data.owner, form.ownerName),
    });
  };

  const run = (action: GovernanceAction) => {
    setMessage(null);
    transition.mutate(action);
  };

  const actionButtons = editing ? (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => {
          setEditing(false);
          setForm(toForm(data));
          setMessage(null);
        }}
      >
        <XIcon className="size-3.5" />
        Huỷ
      </Button>
      <Button size="sm" disabled={isPending} onClick={save}>
        {update.isPending ? <Spinner /> : <SaveIcon className="size-3.5" />}
        Lưu
      </Button>
    </>
  ) : (
    <>
      {canEdit && allowMetadataEditing && !locked && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => {
            setForm(toForm(data));
            setEditing(true);
          }}
        >
          <PencilIcon className="size-3.5" />
          Sửa metadata
        </Button>
      )}
      {canEdit &&
        !data.isArchived &&
        data.allowedTransitions.includes(ApprovalState.InReview) && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run("submit-review")}
          >
            <CircleArrowOutUpRightIcon className="size-3.5" />
            Gửi review
          </Button>
        )}
      {canEdit &&
        data.status === ApprovalState.InReview &&
        data.allowedTransitions.includes(ApprovalState.Draft) && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => run("request-changes")}
          >
            <RotateCcwIcon className="size-3.5" />
            Yêu cầu sửa
          </Button>
        )}
      {canApprove &&
        !data.isArchived &&
        data.allowedTransitions.includes(ApprovalState.Approved) && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run("approve")}
          >
            <CheckIcon className="size-3.5" />
            Phê duyệt
          </Button>
        )}
      {canEdit &&
        !data.isArchived &&
        data.allowedTransitions.includes(ApprovalState.Draft) &&
        data.status !== ApprovalState.InReview && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run("start-revision")}
          >
            <PencilIcon className="size-3.5" />
            Tạo bản sửa đổi
          </Button>
        )}
      {canApprove && !data.isArchived && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={isPending}
          onClick={() => archive.mutate(true)}
        >
          Lưu trữ
        </Button>
      )}
      {canEdit && data.isArchived && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => archive.mutate(false)}
        >
          Bỏ lưu trữ
        </Button>
      )}
    </>
  );

  return (
    <aside className="w-full overflow-hidden border border-border border-t-2 border-t-primary bg-background">
      <div className="flex min-h-12 items-center gap-3 px-3 py-2">
        <div className="flex shrink-0 items-center gap-2">
          <ShieldCheckIcon className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Phê duyệt tài liệu
          </h2>
          <Badge
            variant="outline"
            className={`text-[10px] ${
              data.isArchived
                ? "border-border bg-muted text-muted-foreground"
                : statusClass[data.status]
            }`}
          >
            {data.isArchived
              ? "Lưu trữ"
              : ApprovalStateLabel[data.status]}
          </Badge>
        </div>

        <dl
          className={`hidden min-w-0 flex-1 bg-muted/20 text-xs xl:grid ${
            editing
              ? "grid-cols-[100px_90px_repeat(4,minmax(100px,1fr))]"
              : "grid-cols-[100px_repeat(4,minmax(100px,1fr))]"
          }`}
        >
          <SummaryItem label="Cập nhật" value={formatDate(data.lastUpdated)} />
          {editing && (
            <SummaryItem
              label="Phiên bản"
              value={form.version}
              editing
              onChange={(value) => change("version", value)}
            />
          )}
          <SummaryItem
            label="Author"
            editing={editing}
            value={form.authorName}
            fallbackValue={data.author.displayName}
            onChange={(value) => change("authorName", value)}
          />
          <SummaryItem
            label="Reviewer"
            editing={editing}
            value={form.reviewerName}
            fallbackValue={data.reviewer.displayName}
            onChange={(value) => change("reviewerName", value)}
          />
          <SummaryItem
            label="Approver"
            editing={editing}
            value={form.approverName}
            fallbackValue={data.approver.displayName}
            onChange={(value) => change("approverName", value)}
          />
          <SummaryItem
            label="Owner"
            editing={editing}
            value={form.ownerName}
            fallbackValue={data.owner.displayName}
            onChange={(value) => change("ownerName", value)}
          />
        </dl>

        <div className="ml-auto hidden shrink-0 items-center gap-2 border-l border-border pl-3 xl:flex">
          {actionButtons}
        </div>

        <button
          type="button"
          aria-label={
            mobileExpanded
              ? "Thu gọn thông tin phê duyệt"
              : "Mở thông tin phê duyệt"
          }
          aria-expanded={mobileExpanded}
          className="ml-auto inline-flex size-7 shrink-0 items-center justify-center text-muted-foreground xl:hidden"
          onClick={() => setMobileExpanded((value) => !value)}
        >
          <ChevronDownIcon
            className={`size-4 transition-transform ${
              mobileExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {message && (
        <p
          role="status"
          className="border-t border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground"
        >
          {message}
        </p>
      )}

      <div
        className={`border-t border-border ${
          mobileExpanded ? "block" : "hidden"
        } xl:hidden`}
      >
        <dl className="grid grid-cols-2 bg-muted/20 text-xs sm:grid-cols-3">
          <SummaryItem label="Cập nhật" value={formatDate(data.lastUpdated)} />
          {editing && (
            <SummaryItem
              label="Phiên bản"
              value={form.version}
              editing
              onChange={(value) => change("version", value)}
            />
          )}
          <SummaryItem
            label="Author"
            editing={editing}
            value={form.authorName}
            fallbackValue={data.author.displayName}
            onChange={(value) => change("authorName", value)}
          />
          <SummaryItem
            label="Reviewer"
            editing={editing}
            value={form.reviewerName}
            fallbackValue={data.reviewer.displayName}
            onChange={(value) => change("reviewerName", value)}
          />
          <SummaryItem
            label="Approver"
            editing={editing}
            value={form.approverName}
            fallbackValue={data.approver.displayName}
            onChange={(value) => change("approverName", value)}
          />
          <SummaryItem
            label="Owner"
            editing={editing}
            value={form.ownerName}
            fallbackValue={data.owner.displayName}
            onChange={(value) => change("ownerName", value)}
          />
        </dl>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted/20 px-3 py-2">
          {actionButtons}
        </div>
      </div>
    </aside>
  );
}

function MetaLabel({ children }: { children: string }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

function SummaryItem({
  label,
  value,
  editing = false,
  onChange,
  fallbackValue,
}: {
  label: string;
  value: string;
  editing?: boolean;
  onChange?: (value: string) => void;
  fallbackValue?: string | null;
}) {
  const displayValue = fallbackValue ?? value;

  return (
    <div className="min-w-0 border-b border-r border-border px-3 py-1.5 last:border-r-0 xl:border-b-0">
      <dt>
        <MetaLabel>{label}</MetaLabel>
      </dt>
      {editing && onChange ? (
        <dd>
          <Input
            aria-label={label}
            className="mt-0.5 h-7"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </dd>
      ) : (
        <dd
          className={`mt-0.5 truncate font-semibold ${
            displayValue ? "" : "italic text-muted-foreground"
          }`}
          title={displayValue || "Chưa chỉ định"}
        >
          {displayValue || "Chưa chỉ định"}
        </dd>
      )}
    </div>
  );
}

function toForm(data: DocumentGovernance): GovernanceForm {
  return {
    version: data.version,
    authorName: data.author.displayName ?? "",
    reviewerName: data.reviewer.displayName ?? "",
    approverName: data.approver.displayName ?? "",
    ownerName: data.owner.displayName ?? "",
  };
}

function retainedParticipantId(
  participant: GovernanceParticipant,
  name: string,
) {
  const normalized = name.trim();
  const unchanged = normalized === (participant.displayName ?? "");
  return unchanged ? participant.userId : null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
