import {
  type Change,
  type CommitResult,
  type DirEntry,
  GhError,
  commitFiles,
  getFile,
  listDir,
  topLevelOf,
} from "@/lib/github";
import { ghKeys } from "@/lib/query-keys";
import {
  computeRootSitemapChange,
  computeSitemapChangeFromContents,
  entriesFromContents,
  isSitemapPath,
  type RootSitemapOverrides,
  type SitemapEntry,
} from "@/lib/sitemap";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type RenameFolderArgs = {
  oldFolder: string;
  newFolder: string;
  websiteUser: string;
};

export function useRenameFolder() {
  const qc = useQueryClient();
  return useMutation<
    { files: DirEntry[]; commit: CommitResult | null },
    GhError,
    RenameFolderArgs
  >({
    mutationFn: async ({ oldFolder, newFolder, websiteUser }) => {
      const entries = await listDir(oldFolder);
      const files = entries.filter((e) => e.type === "file");
      const withContent = await Promise.all(
        files.map(async (f) => {
          const data = await getFile(f.path);
          if (!data) throw new GhError("NOT_FOUND", undefined, f.path);
          return { entry: f, content: data.content };
        }),
      );

      const baseName = (p: string) => p.split("/").pop() ?? p;
      const changes: Change[] = [];
      const movedForSitemap: { path: string; content: string }[] = [];
      for (const { entry, content } of withContent) {
        if (isSitemapPath(entry.path)) {
          // Skip carrying the old sitemap over; it will be regenerated for
          // the new folder below (and the old one is deleted with the folder).
          changes.push({ action: "delete", path: entry.path });
          continue;
        }
        const newPath = `${newFolder}/${baseName(entry.path)}`;
        changes.push({ action: "upsert", path: newPath, content });
        changes.push({ action: "delete", path: entry.path });
        movedForSitemap.push({ path: newPath, content });
      }

      const newSitemap = await computeSitemapChangeFromContents(
        newFolder,
        movedForSitemap,
      );
      if (newSitemap) changes.push(newSitemap);

      const oldTop = topLevelOf(oldFolder);
      const newTop = topLevelOf(newFolder);
      const rootOverrides: RootSitemapOverrides = {
        upserts: new Map<string, SitemapEntry[]>(),
        deletedFolders: new Set<string>(),
      };
      if (oldTop && oldTop !== newTop)
        rootOverrides.deletedFolders!.add(oldTop);
      if (newTop) {
        rootOverrides.upserts!.set(
          newTop,
          entriesFromContents(movedForSitemap),
        );
      }
      const rootChange = await computeRootSitemapChange(rootOverrides);
      if (rootChange) changes.push(rootChange);

      const commit = await commitFiles({
        changes,
        message: `Rename folder ${oldFolder} to ${newFolder}`,
        websiteUser,
      });
      return { files, commit };
    },
    onSuccess: ({ files }, args) => {
      for (const entry of files) {
        qc.removeQueries({ queryKey: ghKeys.file(entry.path) });
      }
      qc.removeQueries({ queryKey: ghKeys.dir(args.oldFolder) });
      qc.invalidateQueries({ queryKey: ["gh", "dir"] });
      qc.invalidateQueries({ queryKey: ["gh", "file"] });
      qc.invalidateQueries({ queryKey: ghKeys.historyAll() });
    },
  });
}
