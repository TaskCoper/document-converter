import {
  topLevelFolderExists,
  withSitemap,
} from "@/hooks/gh-mutation-helpers";
import {
  type CommitResult,
  GhError,
  commitFiles,
  parentOf,
} from "@/lib/github";
import { ghKeys } from "@/lib/query-keys";
import { isSitemapPath, sitemapPathFor } from "@/lib/sitemap";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type SaveFileArgs = {
  path: string;
  content: string;
  message: string;
  websiteUser: string;
};

export function useSaveFile() {
  const qc = useQueryClient();
  return useMutation<CommitResult | null, GhError, SaveFileArgs>({
    mutationFn: async (args) => {
      const changes = await withSitemap(
        isSitemapPath(args.path) ? [] : [parentOf(args.path)],
        [{ action: "upsert", path: args.path, content: args.content }],
      );
      return commitFiles({
        changes,
        message: args.message,
        websiteUser: args.websiteUser,
      });
    },
    onSuccess: (_result, args) => {
      qc.invalidateQueries({ queryKey: ghKeys.file(args.path) });
      // Root dir only needs invalidation when the top-level folder was created
      // by this save. If it already exists in cache, subscribers (e.g. the
      // stories folder picker) don't need to refetch.
      if (!topLevelFolderExists(qc, args.path)) {
        qc.invalidateQueries({ queryKey: ghKeys.dir("") });
      }
      qc.invalidateQueries({ queryKey: ghKeys.dir(parentOf(args.path)) });
      qc.invalidateQueries({ queryKey: ghKeys.historyAll() });
      qc.invalidateQueries({ queryKey: ghKeys.historyPath(args.path) });
      if (!isSitemapPath(args.path)) {
        const smPath = sitemapPathFor(parentOf(args.path));
        qc.invalidateQueries({ queryKey: ghKeys.file(smPath) });
        qc.invalidateQueries({ queryKey: ghKeys.historyPath(smPath) });
      }
      qc.invalidateQueries({ queryKey: ghKeys.file(sitemapPathFor("")) });
    },
  });
}
