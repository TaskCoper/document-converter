import { type DirEntry, GhError, listDir } from "@/lib/github";
import { GH_STALE, ghKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useDir(path: string) {
  return useQuery<DirEntry[], GhError>({
    queryKey: ghKeys.dir(path),
    queryFn: () => listDir(path),
    staleTime: GH_STALE,
  });
}
