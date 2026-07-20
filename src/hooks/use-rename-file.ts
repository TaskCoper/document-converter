import { withSitemap } from "@/hooks/gh-mutation-helpers";
import {
  type CommitResult,
  GhError,
  commitFiles,
  getFile,
  parentOf,
} from "@/lib/github";
import { ghKeys } from "@/lib/query-keys";
import { sitemapPathFor } from "@/lib/sitemap";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type RenameFileArgs = {
  oldPath: string;
  newPath: string;
  message: string;
  websiteUser: string;
  content?: string;
};

export function useRenameFile() {
  const qc = useQueryClient();
  return useMutation<CommitResult | null, GhError, RenameFileArgs>({
    mutationFn: async (args) => {
      let content = args.content;
      if (content === undefined) {
        const file = await getFile(args.oldPath);
        if (!file) throw new GhError("NOT_FOUND", undefined, args.oldPath);
        content = file.content;
      }
      const changes = await withSitemap(
        [parentOf(args.oldPath), parentOf(args.newPath)],
        [
          { action: "upsert", path: args.newPath, content },
          { action: "delete", path: args.oldPath },
        ],
      );
      return commitFiles({
        changes,
        message: args.message,
        websiteUser: args.websiteUser,
      });
    },
    onSuccess: (_result, args) => {
      qc.removeQueries({ queryKey: ghKeys.file(args.oldPath) });
      qc.invalidateQueries({ queryKey: ghKeys.file(args.newPath) });
      qc.invalidateQueries({ queryKey: ["gh", "dir"] });
      qc.invalidateQueries({ queryKey: ghKeys.historyAll() });
      for (const folder of new Set([
        parentOf(args.oldPath),
        parentOf(args.newPath),
      ])) {
        if (!folder) continue;
        const smPath = sitemapPathFor(folder);
        qc.invalidateQueries({ queryKey: ghKeys.file(smPath) });
        qc.invalidateQueries({ queryKey: ghKeys.historyPath(smPath) });
      }
      qc.invalidateQueries({ queryKey: ghKeys.file(sitemapPathFor("")) });
    },
  });
}
