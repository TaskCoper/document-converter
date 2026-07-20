import { withSitemap } from "@/hooks/gh-mutation-helpers";
import {
  type CommitResult,
  GhError,
  commitFiles,
  parentOf,
} from "@/lib/github";
import { ghKeys } from "@/lib/query-keys";
import { isSitemapPath, sitemapPathFor } from "@/lib/sitemap";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type DeleteFileArgs = {
  path: string;
  message: string;
  websiteUser: string;
};

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation<CommitResult | null, GhError, DeleteFileArgs>({
    mutationFn: async (args) => {
      const changes = await withSitemap(
        isSitemapPath(args.path) ? [] : [parentOf(args.path)],
        [{ action: "delete", path: args.path }],
      );
      return commitFiles({
        changes,
        message: args.message,
        websiteUser: args.websiteUser,
      });
    },
    onSuccess: (_result, args) => {
      qc.removeQueries({ queryKey: ghKeys.file(args.path) });
      qc.invalidateQueries({ queryKey: ghKeys.dir("") });
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
