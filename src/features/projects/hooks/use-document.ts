import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { PROJECT_STALE, projectKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import documentService from "../document-services";

const hasAuthBackend = !!authConfig.baseURL;

export const useDocument = (documentId: string | undefined) => {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const enabled = !!documentId && hasToken && hasAuthBackend;

  const detail = useQuery({
    queryKey: projectKeys.document(documentId ?? ""),
    queryFn: () => documentService.get(documentId!),
    enabled,
    staleTime: PROJECT_STALE,
  });

  return {
    document: detail.data,
    isLoading: detail.isLoading,
    isError: detail.isError,
  };
};

// Markdown thô của bản nháp — CHỈ là lối thoát khi adapter structured (buildDocumentView)
// không dựng nổi nội dung. Tách hẳn khỏi useDocument và phải bật tường minh: trước đây mọi
// nơi gọi useDocument (trang sửa, trang lịch sử, và mỗi TDD liên quan trong StorySplitView)
// đều kéo theo một request /preview mà không chỗ nào đọc tới.
export const useDocumentPreview = (
  documentId: string | undefined,
  enabled: boolean,
) => {
  const hasToken = useAuthStore((s) => !!s.accessToken);

  const query = useQuery({
    queryKey: projectKeys.documentPreview(documentId ?? ""),
    queryFn: () => documentService.preview(documentId!),
    enabled: enabled && !!documentId && hasToken && hasAuthBackend,
    staleTime: PROJECT_STALE,
  });

  return {
    previewMarkdown: query.data,
    isPreviewLoading: query.isLoading,
  };
};
