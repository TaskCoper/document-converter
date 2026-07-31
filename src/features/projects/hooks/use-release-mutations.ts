import { projectKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import documentService, {
  type ReleaseDocumentBody,
} from "../document-services";

// Release/restore đổi currentVersionNumber/hasUnpublishedChanges trên chính
// tài liệu, và luôn kéo theo danh sách version — invalidate cả hai, cộng dòng trong danh sách
// tài liệu của project (cũng hiện những field này).
const useInvalidateVersions = (projectId: string, documentId: string) => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: projectKeys.document(documentId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.versions(documentId) });
    queryClient.invalidateQueries({
      queryKey: projectKeys.documentLists(projectId),
    });
  };
};

export const useReleaseDocument = (projectId: string, documentId: string) => {
  const invalidate = useInvalidateVersions(projectId, documentId);
  return useMutation({
    mutationFn: (body: ReleaseDocumentBody) =>
      documentService.release(documentId, body),
    onSuccess: invalidate,
  });
};

export const useRestoreVersion = (projectId: string, documentId: string) => {
  const invalidate = useInvalidateVersions(projectId, documentId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionNumber: number) =>
      documentService.restoreVersion(documentId, versionNumber),
    onSuccess: () => {
      invalidate();
      // Restore chỉ ghi đè bản nháp — markdown preview của bản nháp cần refetch lại.
      queryClient.invalidateQueries({
        queryKey: projectKeys.documentPreview(documentId),
      });
    },
  });
};
