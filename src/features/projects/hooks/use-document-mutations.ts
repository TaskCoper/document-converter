import { projectKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import documentService, {
  type CreateDocumentBody,
  type UpdateDetailBody,
  type UpdateMetadataBody,
} from "../document-services";

// Đổi tài liệu ảnh hưởng nhiều nơi (danh sách, số đếm ở project, chi tiết) → invalidate
// rộng theo projectKeys.all cho chắc.
const useInvalidateAll = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: projectKeys.all });
};

export const useCreateDocument = (projectId: string) => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (body: CreateDocumentBody) =>
      documentService.create(projectId, body),
    onSuccess: invalidate,
  });
};

export const useDuplicateDocument = () => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (documentId: string) => documentService.duplicate(documentId),
    onSuccess: invalidate,
  });
};

const useInvalidateDocument = (projectId: string, documentId: string) => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: projectKeys.document(documentId) });
    queryClient.invalidateQueries({
      queryKey: projectKeys.documentPreview(documentId),
    });
    queryClient.invalidateQueries({
      queryKey: projectKeys.documentLists(projectId),
    });
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
  };
};

export const useUpdateDocumentMetadata = (
  projectId: string,
  documentId: string,
) => {
  const invalidate = useInvalidateDocument(projectId, documentId);
  return useMutation({
    mutationFn: (body: UpdateMetadataBody) =>
      documentService.updateMetadata(documentId, body),
    onSuccess: invalidate,
  });
};

export const useUpdateDocumentDetail = (
  projectId: string,
  documentId: string,
) => {
  const invalidate = useInvalidateDocument(projectId, documentId);
  return useMutation({
    mutationFn: (body: UpdateDetailBody) =>
      documentService.updateDetail(documentId, body),
    onSuccess: invalidate,
  });
};

export const useDeleteDocument = () => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (documentId: string) => documentService.remove(documentId),
    onSuccess: invalidate,
  });
};
