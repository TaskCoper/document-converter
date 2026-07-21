import { getHistory } from "@/lib/github";
import { GH_STALE, ghKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useHistory(path?: string) {
  const key = path ? ghKeys.historyPath(path) : ghKeys.historyAll();
  return useQuery({
    queryKey: key,
    queryFn: () => getHistory(path),
    staleTime: GH_STALE,
  });
}
