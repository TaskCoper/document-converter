import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { projectKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import projectService from "../services";

const hasAuthBackend = !!authConfig.baseURL;

export const useProject = (projectId: string | undefined) => {
  const hasToken = useAuthStore((s) => !!s.accessToken);

  const query = useQuery({
    queryKey: projectKeys.detail(projectId ?? ""),
    queryFn: () => projectService.get(projectId!),
    enabled: !!projectId && hasToken && hasAuthBackend,
  });

  return {
    project: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
