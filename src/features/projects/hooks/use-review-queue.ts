import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { PROJECT_STALE, projectKeys } from "@/lib/query-keys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import documentService from "../document-services";

const hasAuthBackend = !!authConfig.baseURL;

export function useReviewQueue(projectId: string | undefined, pageIndex: number) {
  const hasToken = useAuthStore((state) => !!state.accessToken);
  const params = { pageIndex, pageSize: 20 };

  const query = useQuery({
    queryKey: projectKeys.reviewQueue(projectId, params),
    queryFn: () =>
      documentService.listReviewQueue({ projectId, ...params }),
    enabled: hasToken && hasAuthBackend,
    staleTime: PROJECT_STALE,
    placeholderData: keepPreviousData,
  });

  return {
    items: query.data?.items ?? [],
    pageIndex: query.data?.pageIndex ?? pageIndex,
    totalCount: query.data?.totalCount ?? 0,
    hasNextPage: query.data?.hasNextPage ?? false,
    hasPreviousPage: query.data?.hasPreviousPage ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    noBackend: !hasAuthBackend,
    refetch: query.refetch,
  };
}
