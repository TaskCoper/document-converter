import { GhError, getFile } from "@/lib/github";
import { GH_STALE, ghKeys } from "@/lib/query-keys";
import {
  parseRootSitemapMarkdown,
  parseSitemapMarkdown,
  sitemapPathFor,
  type StorySitemapEntry,
} from "@/lib/sitemap";
import { useQuery } from "@tanstack/react-query";

export function useAllStories() {
  return useQuery<StorySitemapEntry[], GhError>({
    queryKey: ghKeys.storiesAll(),
    queryFn: async () => {
      const root = await getFile(sitemapPathFor(""));
      if (!root) return [];
      const folders = parseRootSitemapMarkdown(root.content).filter((f) =>
        f.types.includes("user-story"),
      );
      const perFolder = await Promise.all(
        folders.map(async (f) => {
          const sm = await getFile(sitemapPathFor(f.name));
          if (!sm) return [] as StorySitemapEntry[];
          return parseSitemapMarkdown(sm.content).filter(
            (e): e is StorySitemapEntry => e.type === "user-story",
          );
        }),
      );
      return perFolder.flat();
    },
    staleTime: GH_STALE,
  });
}
