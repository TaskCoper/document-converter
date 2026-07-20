import {
  GhError,
  commitFiles,
  getFile,
  getHistory,
  listDir,
  type Change,
  type CommitResult,
  type DirEntry,
  type FileData,
} from "@/lib/github";
import {
  buildSitemapMarkdown,
  collectFolderContents,
  computeRootSitemapChange,
  computeSitemapChange,
  computeSitemapChangeFromContents,
  entriesFromContents,
  entryFromContent,
  isSitemapPath,
  parseRootSitemapMarkdown,
  parseSitemapMarkdown,
  sitemapPathFor,
  type RootSitemapOverrides,
  type RuleSitemapEntry,
  type SitemapEntry,
  type StorySitemapEntry,
  type TddSitemapEntry,
} from "@/lib/sitemap";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const STALE = 30_000;

export const ghKeys = {
  dir: (path: string) => ["gh", "dir", path] as const,
  file: (path: string) => ["gh", "file", path] as const,
  historyAll: () => ["gh", "history", ""] as const,
  historyPath: (path: string) => ["gh", "history", path] as const,
};

export function parentOf(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, "");
  const idx = trimmed.lastIndexOf("/");
  return idx === -1 ? "" : trimmed.slice(0, idx);
}

function topLevelOf(folder: string): string {
  return folder.split("/")[0];
}

async function withSitemap(
  folders: string[],
  base: Change[],
): Promise<Change[]> {
  const uniq = Array.from(
    new Set(folders.map((f) => f.replace(/^\/+|\/+$/g, "")).filter(Boolean)),
  );

  const perFolder = await Promise.all(
    uniq.map(async (folder) => {
      const smPath = sitemapPathFor(folder);

      // Fast path: parse the existing sitemap and splice the change into it.
      // Avoids listDir + per-file getFile for the target folder.
      let existingSitemap: { content: string } | null = null;
      let entries: SitemapEntry[] | null = null;
      try {
        existingSitemap = await getFile(smPath);
        if (existingSitemap) {
          entries = parseSitemapMarkdown(existingSitemap.content);
        }
      } catch (e) {
        if (!(e instanceof GhError && e.kind === "NOT_FOUND")) throw e;
      }

      // Fallback: sitemap missing or unparsable → full folder scan.
      if (entries === null) {
        try {
          const contents = await collectFolderContents(folder);
          entries = entriesFromContents(contents);
        } catch (e) {
          if (e instanceof GhError && e.kind === "NOT_FOUND") entries = [];
          else throw e;
        }
      }

      const inFolder = (p: string) => parentOf(p) === folder;
      const deletes = new Set(
        base
          .filter((c) => c.action === "delete" && inFolder(c.path))
          .map((c) => c.path),
      );
      const upserts = base.filter(
        (c): c is Extract<Change, { action: "upsert" }> =>
          c.action === "upsert" && inFolder(c.path) && !isSitemapPath(c.path),
      );

      entries = entries.filter((e) => !deletes.has(e.path));
      for (const c of upserts) {
        const next = entryFromContent(c.path, c.content);
        const idx = entries.findIndex((e) => e.path === c.path);
        if (idx >= 0) entries[idx] = next;
        else entries.push(next);
      }
      entries.sort((a, b) => a.path.localeCompare(b.path));

      let change: Change | null = null;
      if (entries.length === 0) {
        if (existingSitemap) change = { action: "delete", path: smPath };
      } else {
        const newContent = buildSitemapMarkdown(folder, entries);
        if (!existingSitemap || existingSitemap.content !== newContent) {
          change = { action: "upsert", path: smPath, content: newContent };
        }
      }

      return { folder, change, entries };
    }),
  );

  const sitemapChanges = perFolder
    .map((r) => r.change)
    .filter((c): c is Change => !!c);

  const overrides: RootSitemapOverrides = {
    upserts: new Map<string, SitemapEntry[]>(),
    deletedFolders: new Set<string>(),
  };
  for (const r of perFolder) {
    const top = topLevelOf(r.folder);
    if (top !== r.folder) continue;
    if (r.entries.length === 0) overrides.deletedFolders!.add(top);
    else overrides.upserts!.set(top, r.entries);
  }

  const rootChange = await computeRootSitemapChange(overrides, {
    trustExistingRoot: true,
  });
  const all = [...base, ...sitemapChanges];
  if (rootChange) all.push(rootChange);
  return all;
}

export function useDir(path: string) {
  return useQuery<DirEntry[], GhError>({
    queryKey: ghKeys.dir(path),
    queryFn: () => listDir(path),
    staleTime: STALE,
  });
}

export function useFile(path: string, enabled = true) {
  return useQuery<FileData | null, GhError>({
    queryKey: ghKeys.file(path),
    queryFn: () => getFile(path),
    staleTime: STALE,
    enabled: enabled && path.length > 0,
  });
}

export function useAllTdds() {
  return useQuery<TddSitemapEntry[], GhError>({
    queryKey: ["gh", "tdds", "all"] as const,
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
    staleTime: STALE,
  });
}

export function useAllStories() {
  return useQuery<StorySitemapEntry[], GhError>({
    queryKey: ["gh", "stories", "all"] as const,
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
    staleTime: STALE,
  });
}

export function useAllRules() {
  return useQuery<RuleSitemapEntry[], GhError>({
    queryKey: ["gh", "rules", "all"] as const,
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
    staleTime: STALE,
  });
}

export function useHistory(path?: string) {
  const key = path ? ghKeys.historyPath(path) : ghKeys.historyAll();
  return useQuery({
    queryKey: key,
    queryFn: () => getHistory(path),
    staleTime: STALE,
  });
}

export type SaveFileArgs = {
  path: string;
  content: string;
  message: string;
  websiteUser: string;
};

function topLevelFolderExists(
  qc: ReturnType<typeof useQueryClient>,
  path: string,
): boolean {
  const parent = parentOf(path);
  if (!parent) return true;
  const top = topLevelOf(parent);
  const cached = qc.getQueryData<DirEntry[]>(ghKeys.dir(""));
  if (!cached) return false;
  return cached.some((e) => e.type === "dir" && e.name === top);
}

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

export function messageFor(err: unknown): string {
  if (!(err instanceof GhError)) return "Có lỗi xảy ra. Vui lòng thử lại.";
  switch (err.kind) {
    case "UNAUTHORIZED":
      return "Token GitHub không hợp lệ hoặc đã hết hạn.";
    case "RATE_LIMIT":
      return "Đã vượt giới hạn API của GitHub. Thử lại sau ít phút.";
    case "NOT_FOUND":
      return "Không tìm thấy file hoặc thư mục.";
    case "CONFLICT":
      return "Có người vừa chỉnh sửa file này. Vui lòng tải lại rồi thử lại.";
    case "VALIDATION":
      return `Yêu cầu không hợp lệ${err.detail ? `: ${err.detail}` : ""}.`;
    case "NETWORK":
      return "Không kết nối được đến GitHub. Kiểm tra mạng và thử lại.";
    default:
      return err.detail || "Có lỗi xảy ra khi gọi GitHub.";
  }
}
