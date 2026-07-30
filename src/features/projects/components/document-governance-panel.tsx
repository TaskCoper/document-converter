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
  GovernanceStatus,
  GovernanceStatusLabel,
} from "@/features/projects/document-types";
import { errorDetail } from "@/features/projects/error";
import { useDocumentGovernance } from "@/features/projects/hooks/use-document-governance";
import { projectKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
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
  | "deprecate"
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
  [GovernanceStatus.Draft]:
    "border-orange-300 bg-orange-50 text-orange-800",
  [GovernanceStatus.InReview]: "border-sky-300 bg-sky-50 text-sky-800",
  [GovernanceStatus.Approved]:
    "border-emerald-300 bg-emerald-50 text-emerald-800",
  [GovernanceStatus.Deprecated]:
    "border-slate-300 bg-slate-100 text-slate-700",
};

export function DocumentGovernancePanel({
  documentId,
  canEdit,
  canApprove,
}: {
  documentId: string;
  canEdit: boolean;
  canApprove: boolean;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useDocumentGovernance(documentId);
  const [editing, setEditing] = useState(false);
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
    onSuccess: async (result) => {
      setMessage(
        `Đã chuyển trạng thái sang ${GovernanceStatusLabel[result.status]}.`,
      );
      await refresh();
    },
    onError: (error) => {
      setMessage(errorDetail(error, "Không chuyển được trạng thái tài liệu."));
    },
  });

  if (isLoading) {
    return (
      <aside className="flex min-h-48 items-center justify-center border border-orange-200 bg-orange-50/40 p-4 lg:w-[360px]">
        <Spinner />
      </aside>
    );
  }

  if (isError || !data) {
    return (
      <aside className="border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive lg:w-[360px]">
        Không tải được thông tin phê duyệt.
      </aside>
    );
  }

  const locked =
    data.status === GovernanceStatus.Approved ||
    data.status === GovernanceStatus.Deprecated;
  const isPending = update.isPending || transition.isPending;

  const change = (field: keyof GovernanceForm, value: string) => {
    setMessage(null);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = () => {
    setMessage(null);
    update.mutate({
      version: form.version,
      ...participantBody("author", data.author, form.authorName),
      ...participantBody("reviewer", data.reviewer, form.reviewerName),
      ...participantBody("approver", data.approver, form.approverName),
      ...participantBody("owner", data.owner, form.ownerName),
    });
  };

  const run = (action: GovernanceAction) => {
    setMessage(null);
    transition.mutate(action);
  };

  return (
    <aside className="border border-orange-200 bg-[linear-gradient(145deg,rgba(255,247,237,.96),rgba(255,255,255,.98))] shadow-[3px_3px_0_rgba(251,146,60,.18)] lg:w-[360px]">
      <div className="flex items-center justify-between border-b border-orange-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="size-4 text-orange-700" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-950">
            Review & phê duyệt
          </h2>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] ${statusClass[data.status]}`}
        >
          {GovernanceStatusLabel[data.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-[92px_1fr] gap-x-3 gap-y-2.5 px-4 py-3 text-xs">
        <MetaLabel>ID</MetaLabel>
        <span className="font-mono font-semibold text-orange-950">{data.id}</span>
        <MetaLabel>Title</MetaLabel>
        <span className="font-medium">{data.title}</span>
        <MetaLabel>Version</MetaLabel>
        {editing ? (
          <Input
            aria-label="Version"
            className="h-7"
            value={form.version}
            onChange={(event) => change("version", event.target.value)}
          />
        ) : (
          <span>{data.version}</span>
        )}
        <MetaLabel>Last updated</MetaLabel>
        <span>{formatDate(data.lastUpdated)}</span>
        <ParticipantRow
          label="Author"
          editing={editing}
          value={form.authorName}
          display={data.author.displayName}
          onChange={(value) => change("authorName", value)}
        />
        <ParticipantRow
          label="Reviewer"
          editing={editing}
          value={form.reviewerName}
          display={data.reviewer.displayName}
          onChange={(value) => change("reviewerName", value)}
        />
        <ParticipantRow
          label="Approver"
          editing={editing}
          value={form.approverName}
          display={data.approver.displayName}
          onChange={(value) => change("approverName", value)}
        />
        <ParticipantRow
          label="Owner"
          editing={editing}
          value={form.ownerName}
          display={data.owner.displayName}
          onChange={(value) => change("ownerName", value)}
        />
      </div>

      {message && (
        <p
          role="status"
          className="border-t border-orange-100 px-4 py-2 text-[11px] text-muted-foreground"
        >
          {message}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-orange-200 bg-orange-50/50 px-4 py-3">
        {editing ? (
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
            {canEdit && !locked && (
              <Button
                variant="outline"
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
              data.allowedTransitions.includes(GovernanceStatus.InReview) && (
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
              data.status === GovernanceStatus.InReview &&
              data.allowedTransitions.includes(GovernanceStatus.Draft) && (
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
              data.allowedTransitions.includes(GovernanceStatus.Approved) && (
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
              data.allowedTransitions.includes(GovernanceStatus.Draft) &&
              data.status !== GovernanceStatus.InReview && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => run("start-revision")}
                >
                  <PencilIcon className="size-3.5" />
                  Tạo bản sửa đổi
                </Button>
              )}
            {canApprove &&
              data.allowedTransitions.includes(GovernanceStatus.Deprecated) && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => run("deprecate")}
                >
                  Ngừng sử dụng
                </Button>
              )}
          </>
        )}
      </div>
    </aside>
  );
}

function MetaLabel({ children }: { children: string }) {
  return <span className="font-medium text-orange-900/70">{children}</span>;
}

function ParticipantRow({
  label,
  editing,
  value,
  display,
  onChange,
}: {
  label: string;
  editing: boolean;
  value: string;
  display: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <MetaLabel>{label}</MetaLabel>
      {editing ? (
        <Input
          aria-label={label}
          className="h-7"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <span className={display ? "" : "italic text-muted-foreground"}>
          {display || "Chưa chỉ định"}
        </span>
      )}
    </>
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

function participantBody(
  role: "author" | "reviewer" | "approver" | "owner",
  participant: GovernanceParticipant,
  name: string,
) {
  const normalized = name.trim();
  const unchanged = normalized === (participant.displayName ?? "");
  return {
    [`${role}Id`]: unchanged ? participant.userId : null,
    [`${role}Name`]: normalized || null,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
