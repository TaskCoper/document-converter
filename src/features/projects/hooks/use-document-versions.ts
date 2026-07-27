import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { PROJECT_STALE, projectKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import documentService from "../document-services";

const hasAuthBackend = !!authConfig.baseURL;

function useVersionsEnabled(documentId: string | undefined) {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  return !!documentId && hasToken && hasAuthBackend;
}

export function useVersions(documentId: string | undefined) {
  const enabled = useVersionsEnabled(documentId);
  const query = useQuery({
    queryKey: projectKeys.versions(documentId ?? ""),
    queryFn: () => documentService.getVersions(documentId!),
    enabled,
    staleTime: PROJECT_STALE,
  });
  return {
    versions: query.data ?? [],
    isLoading: enabled && query.isLoading,
    isError: query.isError,
  };
}

export function useVersionDetail(
  documentId: string | undefined,
  versionNumber: number | undefined,
) {
  const enabled = useVersionsEnabled(documentId) && versionNumber !== undefined;
  const query = useQuery({
    queryKey: projectKeys.version(documentId ?? "", versionNumber ?? 0),
    queryFn: () => documentService.getVersion(documentId!, versionNumber!),
    enabled,
    staleTime: PROJECT_STALE,
  });
  return {
    version: query.data,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
  };
}

export function useVersionMarkdown(
  documentId: string | undefined,
  versionNumber: number | undefined,
) {
  const enabled = useVersionsEnabled(documentId) && versionNumber !== undefined;
  const query = useQuery({
    queryKey: projectKeys.versionMarkdown(documentId ?? "", versionNumber ?? 0),
    queryFn: () => documentService.getVersionMarkdown(documentId!, versionNumber!),
    enabled,
    staleTime: PROJECT_STALE,
  });
  return {
    markdown: query.data,
    isLoading: enabled && query.isLoading,
  };
}

export function useVersionDiff(
  documentId: string | undefined,
  from: number | undefined,
  to: number | undefined,
) {
  const enabled =
    useVersionsEnabled(documentId) && from !== undefined && to !== undefined;
  const query = useQuery({
    queryKey: projectKeys.versionDiff(documentId ?? "", from ?? 0, to ?? 0),
    queryFn: () => documentService.getVersionDiff(documentId!, from!, to!),
    enabled,
    staleTime: PROJECT_STALE,
  });
  return {
    diff: query.data,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
  };
}
