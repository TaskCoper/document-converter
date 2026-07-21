import { type FileData, GhError, getFile } from "@/lib/github";
import { GH_STALE, ghKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useFile(path: string, enabled = true) {
  return useQuery<FileData | null, GhError>({
    queryKey: ghKeys.file(path),
    queryFn: () => getFile(path),
    staleTime: GH_STALE,
    enabled: enabled && path.length > 0,
  });
}
