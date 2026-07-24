import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { projectKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import repositoryConfigService from "../repository-services";

const hasAuthBackend = !!authConfig.baseURL;

export const useRepositories = (
  projectId: string | undefined,
  enabled = true,
) => {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const isFake = useAuthStore((s) => s.isFake);

  const query = useQuery({
    queryKey: projectKeys.repositories(projectId ?? ""),
    queryFn: () => repositoryConfigService.list(projectId!),
    enabled:
      enabled && !!projectId && hasToken && !isFake && hasAuthBackend,
  });

  return {
    repositories: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
