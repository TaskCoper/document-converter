import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  ApprovalStateLabel,
  type GovernanceParticipant,
} from "@/features/projects/document-types";
import {
  GOVERNANCE_LEGACY_VALUE,
  GOVERNANCE_UNASSIGNED_VALUE,
  type GovernanceMetadataEditor,
} from "@/features/projects/hooks/use-governance-metadata-editor";
import type { MemberInfo } from "@/features/projects/types";

export function DocumentGovernanceMetadataEditor({
  editor,
}: {
  editor: GovernanceMetadataEditor;
}) {
  if (editor.isLoading) {
    return (
      <FieldSet>
        <FieldLegend>Metadata quản trị tài liệu</FieldLegend>
        <div className="flex min-h-20 items-center justify-center border border-border">
          <Spinner />
        </div>
      </FieldSet>
    );
  }

  if (editor.isError || !editor.data) {
    return (
      <FieldSet>
        <FieldLegend>Metadata quản trị tài liệu</FieldLegend>
        <p className="border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          Không tải được metadata quản trị tài liệu.
        </p>
      </FieldSet>
    );
  }

  return (
    <FieldSet>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <FieldLegend>Metadata quản trị tài liệu</FieldLegend>
          <p className="mt-1 text-xs text-muted-foreground">
            Phiên bản và các member chịu trách nhiệm cho tài liệu.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono font-semibold text-primary">
            {editor.data.id}
          </span>
          <span className="border border-border bg-muted/30 px-2 py-1 font-medium">
            {editor.data.isArchived
              ? "Lưu trữ"
              : ApprovalStateLabel[editor.data.status]}
          </span>
        </div>
      </div>

      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="governance-version">Phiên bản</FieldLabel>
            <Input
              id="governance-version"
              value={editor.form.version}
              onChange={(event) =>
                editor.change("version", event.target.value)
              }
              placeholder="v2.0"
            />
          </Field>
          <ParticipantSelect
            id="governance-author"
            label="Author"
            required
            value={editor.form.authorId}
            participant={editor.data.author}
            members={editor.members}
            onChange={(value) => editor.change("authorId", value)}
          />
          <ParticipantSelect
            id="governance-reviewer"
            label="Reviewer"
            value={editor.form.reviewerId}
            participant={editor.data.reviewer}
            members={editor.members}
            onChange={(value) => editor.change("reviewerId", value)}
          />
          <ParticipantSelect
            id="governance-approver"
            label="Approver"
            value={editor.form.approverId}
            participant={editor.data.approver}
            members={editor.members}
            onChange={(value) => editor.change("approverId", value)}
          />
          <ParticipantSelect
            id="governance-owner"
            label="Owner"
            required
            value={editor.form.ownerId}
            participant={editor.data.owner}
            members={editor.members}
            onChange={(value) => editor.change("ownerId", value)}
          />
          <Field>
            <FieldLabel>Cập nhật gần nhất</FieldLabel>
            <div className="flex h-9 items-center border border-border bg-muted/30 px-3 text-sm text-muted-foreground">
              {formatDate(editor.data.lastUpdated)}
            </div>
          </Field>
        </div>
        {editor.members.length === 0 && (
          <FieldError role="alert">
            Dự án chưa có member để gán cho metadata tài liệu.
          </FieldError>
        )}
      </FieldGroup>
    </FieldSet>
  );
}

function ParticipantSelect({
  id,
  label,
  required = false,
  value,
  participant,
  members,
  onChange,
}: {
  id: string;
  label: "Author" | "Reviewer" | "Approver" | "Owner";
  required?: boolean;
  value: string;
  participant: GovernanceParticipant;
  members: MemberInfo[];
  onChange: (value: string) => void;
}) {
  const selectedMember = members.find((member) => member.userId === value);
  const isLegacyName = value === GOVERNANCE_LEGACY_VALUE;
  const isMissingMember =
    value !== GOVERNANCE_UNASSIGNED_VALUE &&
    value !== GOVERNANCE_LEGACY_VALUE &&
    !selectedMember;
  const isRequiredMissing =
    required && value === GOVERNANCE_UNASSIGNED_VALUE;
  const invalid = isLegacyName || isMissingMember || isRequiredMissing;
  const displayValue = selectedMember
    ? selectedMember.fullName || selectedMember.email
    : value === GOVERNANCE_UNASSIGNED_VALUE
      ? "Chưa chỉ định"
      : participant.displayName
        ? `Dữ liệu cũ: ${participant.displayName}`
        : "Chọn member";

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && <span aria-hidden="true">*</span>}
      </FieldLabel>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue) {
            onChange(nextValue);
          }
        }}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={invalid || undefined}
        >
          <SelectValue placeholder="Chọn member">{displayValue}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {!required && (
            <SelectItem value={GOVERNANCE_UNASSIGNED_VALUE}>
              Chưa chỉ định
            </SelectItem>
          )}
          {(isLegacyName || isMissingMember) && (
            <SelectItem value={value} disabled>
              Dữ liệu cũ · {participant.displayName || "Không xác định"}
            </SelectItem>
          )}
          {members.map((member) => (
            <SelectItem key={member.userId} value={member.userId}>
              {member.fullName || member.email}
              <span className="text-muted-foreground">· {member.email}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLegacyName && (
        <FieldError>
          {participant.displayName} đang được lưu dưới dạng text. Hãy chọn một
          member hoặc “Chưa chỉ định”.
        </FieldError>
      )}
      {isMissingMember && (
        <FieldError>
          Member đã gán không còn thuộc dự án. Hãy chọn lại.
        </FieldError>
      )}
      {isRequiredMissing && (
        <FieldError>{label} là trường bắt buộc.</FieldError>
      )}
    </Field>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
