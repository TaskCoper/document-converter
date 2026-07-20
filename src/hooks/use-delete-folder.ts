import {
  type Change,
  type CommitResult,
  type DirEntry,
  GhError,
  commitFiles,
  listDir,
  topLevelOf,
} from "@/lib/github";
import { ghKeys } from "@/lib/query-keys";
import { computeRootSitemapChange } from "@/lib/sitemap";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type DeleteFolderArgs = {
  folder: string;
  websiteUser: string;
};

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation<
    { files: DirEntry[]; commit: CommitResult | null },
    GhError,
    DeleteFolderArgs
  >({
    mutationFn: async ({ folder, websiteUser }) => {
      const entries = await listDir(folder);
      const files = entries.filter((e) => e.type === "file");
      const changes: Change[] = files.map((f) => ({
        action: "delete" as const,
        path: f.path,
      }));
      const top = topLevelOf(folder);
      if (top) {
        const rootChange = await computeRootSitemapChange({
          deletedFolders: new Set([top]),
        });
        if (rootChange) changes.push(rootChange);
      }
      const commit = await commitFiles({
        changes,
        message: `Delete folder ${folder}`,
        websiteUser,
      });
      return { files, commit };
    },
    onSuccess: ({ files }, args) => {
      for (const entry of files) {
        qc.removeQueries({ queryKey: ghKeys.file(entry.path) });
      }
      qc.removeQueries({ queryKey: ghKeys.dir(args.folder) });
      qc.invalidateQueries({ queryKey: ["gh", "dir"] });
      qc.invalidateQueries({ queryKey: ["gh", "file"] });
      qc.invalidateQueries({ queryKey: ghKeys.historyAll() });
    },
  });
}
