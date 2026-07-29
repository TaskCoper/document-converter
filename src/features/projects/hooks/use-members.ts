import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { PROJECT_STALE, projectKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import projectService from "../services";

const hasAuthBackend = !!authConfig.baseURL;

export const useMembers = (projectId: string | undefined) => {
  const hasToken = useAuthStore((s) => !!s.accessToken);

  const query = useQuery({
    queryKey: projectKeys.members(projectId ?? ""),
    queryFn: () => projectService.listMembers(projectId!),
    enabled: !!projectId && hasToken && hasAuthBackend,
    staleTime: PROJECT_STALE,
  });

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
