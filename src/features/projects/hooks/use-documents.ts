import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { projectKeys } from "@/lib/query-keys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import documentService, {
  type DocumentListParams,
} from "../document-services";

const hasAuthBackend = !!authConfig.baseURL;

export const useDocuments = (
  projectId: string | undefined,
  params: DocumentListParams,
) => {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const isFake = useAuthStore((s) => s.isFake);

  const query = useQuery({
    queryKey: projectKeys.documents(projectId ?? "", params),
    queryFn: () => documentService.list(projectId!, params),
    enabled: !!projectId && hasToken && !isFake && hasAuthBackend,
    // Giữ danh sách cũ khi đổi filter/trang để bảng không nhấp nháy.
    placeholderData: keepPreviousData,
  });

  return {
    documents: query.data?.items ?? [],
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  };
};
