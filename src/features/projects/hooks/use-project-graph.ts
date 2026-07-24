import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { projectKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import graphService from "../graph-services";

const hasAuthBackend = !!authConfig.baseURL;

function useGraphViewEnabled(projectId: string | undefined) {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const isFake = useAuthStore((s) => s.isFake);
  return !!projectId && hasToken && !isFake && hasAuthBackend;
}

export function useProjectGraph(projectId: string | undefined) {
  const enabled = useGraphViewEnabled(projectId);
  const query = useQuery({
    queryKey: projectKeys.projectGraph(projectId ?? ""),
    queryFn: () => graphService.getProjectGraph(projectId!),
    enabled,
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
  });
  return {
    registry: query.data,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
  };
}
