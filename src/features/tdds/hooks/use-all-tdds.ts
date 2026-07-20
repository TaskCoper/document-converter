import { GhError, getFile } from "@/lib/github";
import { GH_STALE, ghKeys } from "@/lib/query-keys";
import {
  parseRootSitemapMarkdown,
  parseSitemapMarkdown,
  sitemapPathFor,
  type TddSitemapEntry,
} from "@/lib/sitemap";
import { useQuery } from "@tanstack/react-query";

export function useAllTdds() {
  return useQuery<TddSitemapEntry[], GhError>({
    queryKey: ghKeys.tddsAll(),
    queryFn: async () => {
      const root = await getFile(sitemapPathFor(""));
      if (!root) return [];
      const folders = parseRootSitemapMarkdown(root.content).filter((f) =>
        f.types.includes("tdd"),
      );
      const perFolder = await Promise.all(
        folders.map(async (f) => {
          const sm = await getFile(sitemapPathFor(f.name));
          if (!sm) return [] as TddSitemapEntry[];
          return parseSitemapMarkdown(sm.content).filter(
            (e): e is TddSitemapEntry => e.type === "tdd",
          );
        }),
      );
      return perFolder.flat();
    },
    staleTime: GH_STALE,
  });
}
