import documentService from "@/features/projects/document-services";
import type { DocumentGovernance } from "@/features/projects/document-types";
import { useDocumentGovernance } from "@/features/projects/hooks/use-document-governance";
import { useMembers } from "@/features/projects/hooks/use-members";
import { projectKeys } from "@/lib/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface GovernanceMetadataForm {
  version: string;
  authorId: string;
  reviewerId: string;
  approverId: string;
  ownerId: string;
}

export const GOVERNANCE_UNASSIGNED_VALUE = "__unassigned__";
export const GOVERNANCE_LEGACY_VALUE = "__legacy__";

export function useGovernanceMetadataEditor(
  documentId: string,
  projectId: string,
) {
  const queryClient = useQueryClient();
  const governance = useDocumentGovernance(documentId);
  const membersQuery = useMembers(projectId);
  const [draft, setDraft] = useState<GovernanceMetadataForm | null>(null);

  const form = draft ?? (governance.data ? toForm(governance.data) : emptyForm);

  const change = (field: keyof GovernanceMetadataForm, value: string) => {
    setDraft((current) => ({
      ...(current ??
        (governance.data ? toForm(governance.data) : emptyForm)),
      [field]: value,
    }));
  };

  const save = async () => {
    if (!governance.data) {
      throw new Error("Chưa tải được metadata quản trị tài liệu.");
    }

    const version = form.version.trim();
    if (!version) {
      throw new Error("Phiên bản tài liệu không được để trống.");
    }

    if (membersQuery.isLoading) {
      throw new Error("Danh sách thành viên dự án đang được tải.");
    }
    if (membersQuery.isError) {
      throw new Error("Không tải được danh sách thành viên dự án.");
    }

    const memberIds = new Set(
      membersQuery.members.map((member) => member.userId),
    );
    const authorId = participantId("Author", form.authorId, true, memberIds);
    const reviewerId = participantId(
      "Reviewer",
      form.reviewerId,
      false,
      memberIds,
    );
    const approverId = participantId(
      "Approver",
      form.approverId,
      false,
      memberIds,
    );
    const ownerId = participantId("Owner", form.ownerId, true, memberIds);

    await documentService.updateGovernance(documentId, {
      version,
      authorId,
      reviewerId,
      approverId,
      ownerId,
    });

    setDraft(null);
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

  return {
    data: governance.data,
    form,
    members: membersQuery.members,
    isLoading: governance.isLoading || membersQuery.isLoading,
    isError: governance.isError || membersQuery.isError,
    change,
    save,
  };
}

export type GovernanceMetadataEditor = ReturnType<
  typeof useGovernanceMetadataEditor
>;

const emptyForm: GovernanceMetadataForm = {
  version: "",
  authorId: GOVERNANCE_UNASSIGNED_VALUE,
  reviewerId: GOVERNANCE_UNASSIGNED_VALUE,
  approverId: GOVERNANCE_UNASSIGNED_VALUE,
  ownerId: GOVERNANCE_UNASSIGNED_VALUE,
};

function toForm(data: DocumentGovernance): GovernanceMetadataForm {
  return {
    version: data.version,
    authorId: participantFormValue(
      data.author.userId,
      data.author.displayName,
    ),
    reviewerId: participantFormValue(
      data.reviewer.userId,
      data.reviewer.displayName,
    ),
    approverId: participantFormValue(
      data.approver.userId,
      data.approver.displayName,
    ),
    ownerId: participantFormValue(data.owner.userId, data.owner.displayName),
  };
}

function participantFormValue(
  userId: string | null,
  displayName: string | null,
) {
  if (userId) {
    return userId;
  }
  return displayName
    ? GOVERNANCE_LEGACY_VALUE
    : GOVERNANCE_UNASSIGNED_VALUE;
}

function participantId(
  label: string,
  value: string,
  required: boolean,
  memberIds: Set<string>,
) {
  if (value === GOVERNANCE_LEGACY_VALUE) {
    throw new Error(
      `${label} đang là dữ liệu text cũ. Hãy chọn một member trong dự án.`,
    );
  }

  if (value === GOVERNANCE_UNASSIGNED_VALUE) {
    if (required) {
      throw new Error(`${label} là trường bắt buộc.`);
    }
    return null;
  }

  if (!memberIds.has(value)) {
    throw new Error(`${label} phải là member của dự án.`);
  }

  return value;
}
