import { type Change, type CommitResult, GhError, commitFiles } from "@/lib/github";
import { ghKeys } from "@/lib/query-keys";
import {
  computeRootSitemapChange,
  computeSitemapChange,
  sitemapPathFor,
} from "@/lib/sitemap";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type RegenerateSitemapArgs = {
  folder: string;
  message?: string;
  websiteUser: string;
};

export function useRegenerateSitemap() {
  const qc = useQueryClient();
  return useMutation<CommitResult | null, GhError, RegenerateSitemapArgs>({
    mutationFn: async (args) => {
      const clean = args.folder.replace(/^\/+|\/+$/g, "");
      const changes: Change[] = [];
      if (clean) {
        const folderChange = await computeSitemapChange(clean);
        if (folderChange) changes.push(folderChange);
      }
      const rootChange = await computeRootSitemapChange();
      if (rootChange) changes.push(rootChange);
      if (!changes.length) return null;
      return commitFiles({
        changes,
        message: args.message ?? `chore: update ${sitemapPathFor(clean)}`,
        websiteUser: args.websiteUser,
      });
    },
    onSuccess: (_result, args) => {
      const smPath = sitemapPathFor(args.folder);
      qc.invalidateQueries({ queryKey: ghKeys.file(smPath) });
      qc.invalidateQueries({ queryKey: ghKeys.historyPath(smPath) });
      const rootPath = sitemapPathFor("");
      qc.invalidateQueries({ queryKey: ghKeys.file(rootPath) });
      qc.invalidateQueries({ queryKey: ghKeys.historyPath(rootPath) });
      qc.invalidateQueries({ queryKey: ghKeys.historyAll() });
    },
  });
}
