import {
  type Change,
  type CommitResult,
  type DirEntry,
  type FileData,
  GhError,
  commitFiles,
  getFile,
  getHistory,
  listDir,
} from "@/lib/github";
import {
  collectFolderContents,
  computeSitemapChange,
  computeSitemapChangeFromContents,
  isSitemapPath,
  sitemapPathFor,
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

async function withSitemap(
  folders: string[],
  base: Change[],
): Promise<Change[]> {
  const uniq = Array.from(
    new Set(folders.map((f) => f.replace(/^\/+|\/+$/g, "")).filter(Boolean)),
  );
  const sm = (
    await Promise.all(
      uniq.map(async (folder) => {
        let existing: { path: string; content: string }[] = [];
        try {
          existing = await collectFolderContents(folder);
        } catch (e) {
          if (!(e instanceof GhError && e.kind === "NOT_FOUND")) throw e;
        }

        const inFolder = (p: string) => parentOf(p) === folder;
        const deletes = new Set(
          base
            .filter((c) => c.action === "delete" && inFolder(c.path))
            .map((c) => c.path),
        );
        const upserts = new Map(
          base
            .filter(
              (c): c is Extract<Change, { action: "upsert" }> =>
                c.action === "upsert" &&
                inFolder(c.path) &&
                !isSitemapPath(c.path),
            )
            .map((c) => [c.path, c.content]),
        );

        const merged = new Map<string, string>();
        for (const f of existing) {
          if (deletes.has(f.path)) continue;
          merged.set(f.path, f.content);
        }
        for (const [p, c] of upserts) merged.set(p, c);

        return computeSitemapChangeFromContents(
          folder,
          Array.from(merged, ([path, content]) => ({ path, content })),
        );
      }),
    )
  ).filter((c): c is Change => !!c);
  return [...base, ...sm];
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
      qc.invalidateQueries({ queryKey: ghKeys.dir("") });
      qc.invalidateQueries({ queryKey: ghKeys.dir(parentOf(args.path)) });
      qc.invalidateQueries({ queryKey: ghKeys.historyAll() });
      qc.invalidateQueries({ queryKey: ghKeys.historyPath(args.path) });
      if (!isSitemapPath(args.path)) {
        const smPath = sitemapPathFor(parentOf(args.path));
        qc.invalidateQueries({ queryKey: ghKeys.file(smPath) });
        qc.invalidateQueries({ queryKey: ghKeys.historyPath(smPath) });
      }
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
      const change = await computeSitemapChange(args.folder);
      if (!change) return null;
      return commitFiles({
        changes: [change],
        message: args.message ?? `chore: update ${sitemapPathFor(args.folder)}`,
        websiteUser: args.websiteUser,
      });
    },
    onSuccess: (_result, args) => {
      const smPath = sitemapPathFor(args.folder);
      qc.invalidateQueries({ queryKey: ghKeys.file(smPath) });
      qc.invalidateQueries({ queryKey: ghKeys.historyPath(smPath) });
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
