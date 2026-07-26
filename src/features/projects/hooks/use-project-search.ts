import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { projectKeys } from "@/lib/query-keys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import documentService, { type SearchParams } from "../document-services";

const hasAuthBackend = !!authConfig.baseURL;

export function useProjectSearch(
  projectId: string | undefined,
  params: SearchParams,
) {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const q = params.q.trim();

  const query = useQuery({
    queryKey: projectKeys.search(projectId ?? "", params),
    queryFn: () => documentService.search(projectId!, { ...params, q }),
    enabled: !!projectId && !!q && hasToken && hasAuthBackend,
    placeholderData: keepPreviousData,
  });

  return {
    result: query.data ?? null,
    hits: query.data?.hits ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  };
}
