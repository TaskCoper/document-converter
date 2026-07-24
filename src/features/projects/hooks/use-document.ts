import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { projectKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import documentService from "../document-services";

const hasAuthBackend = !!authConfig.baseURL;

export const useDocument = (documentId: string | undefined) => {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const isFake = useAuthStore((s) => s.isFake);
  const enabled = !!documentId && hasToken && !isFake && hasAuthBackend;

  const detail = useQuery({
    queryKey: projectKeys.document(documentId ?? ""),
    queryFn: () => documentService.get(documentId!),
    enabled,
  });

  const preview = useQuery({
    queryKey: projectKeys.documentPreview(documentId ?? ""),
    queryFn: () => documentService.preview(documentId!),
    enabled,
  });

  return {
    document: detail.data,
    isLoading: detail.isLoading,
    isError: detail.isError,
    previewMarkdown: preview.data,
    isPreviewLoading: preview.isLoading,
  };
};
