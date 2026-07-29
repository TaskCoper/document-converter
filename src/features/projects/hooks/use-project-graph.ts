import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { PROJECT_STALE, projectKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import graphService from "../graph-services";

const hasAuthBackend = !!authConfig.baseURL;

function useGraphViewEnabled(projectId: string | undefined) {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  return !!projectId && hasToken && hasAuthBackend;
}

export function useProjectGraph(projectId: string | undefined) {
  const enabled = useGraphViewEnabled(projectId);
  const query = useQuery({
    queryKey: projectKeys.projectGraph(projectId ?? ""),
    queryFn: () => graphService.getProjectGraph(projectId!),
    enabled,
    staleTime: PROJECT_STALE,
  });
  return {
    graph: query.data,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
  };
}

export function useLinkIssues(
  projectId: string | undefined,
  staleDays: number,
) {
  const enabled = useGraphViewEnabled(projectId);
  const query = useQuery({
    queryKey: projectKeys.linkIssues(projectId ?? "", staleDays),
    queryFn: () => graphService.getLinkIssues(projectId!, staleDays),
    enabled,
    staleTime: PROJECT_STALE,
  });
  return {
    issues: query.data ?? [],
    isLoading: enabled && query.isLoading,
    isError: query.isError,
  };
}

export function useErrorCodes(projectId: string | undefined) {
  const enabled = useGraphViewEnabled(projectId);
  const query = useQuery({
    queryKey: projectKeys.errorCodes(projectId ?? ""),
    queryFn: () => graphService.getErrorCodes(projectId!),
    enabled,
    staleTime: PROJECT_STALE,
  });
  return {
    registry: query.data,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
  };
}
