import { GhError, getFile } from "@/lib/github";
import { GH_STALE, ghKeys } from "@/lib/query-keys";
import {
  parseRootSitemapMarkdown,
  parseSitemapMarkdown,
  sitemapPathFor,
  type RuleSitemapEntry,
} from "@/lib/sitemap";
import { useQuery } from "@tanstack/react-query";

export function useAllRules() {
  return useQuery<RuleSitemapEntry[], GhError>({
    queryKey: ghKeys.rulesAll(),
    queryFn: async () => {
      const root = await getFile(sitemapPathFor(""));
      if (!root) return [];
      const folders = parseRootSitemapMarkdown(root.content).filter((f) =>
        f.types.includes("business-rule"),
      );
      const perFolder = await Promise.all(
        folders.map(async (f) => {
          const sm = await getFile(sitemapPathFor(f.name));
          if (!sm) return [] as RuleSitemapEntry[];
          return parseSitemapMarkdown(sm.content).filter(
            (e): e is RuleSitemapEntry => e.type === "business-rule",
          );
        }),
      );
      return perFolder.flat();
    },
    staleTime: GH_STALE,
  });
}
