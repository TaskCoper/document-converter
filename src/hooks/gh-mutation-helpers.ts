import {
  type Change,
  type DirEntry,
  GhError,
  getFile,
  parentOf,
  topLevelOf,
} from "@/lib/github";
import {
  buildSitemapMarkdown,
  collectFolderContents,
  computeRootSitemapChange,
  entriesFromContents,
  entryFromContent,
  isSitemapPath,
  parseSitemapMarkdown,
  sitemapPathFor,
  type RootSitemapOverrides,
  type SitemapEntry,
} from "@/lib/sitemap";
import type { QueryClient } from "@tanstack/react-query";
import { ghKeys } from "@/lib/query-keys";

export function topLevelFolderExists(qc: QueryClient, path: string): boolean {
  const parent = parentOf(path);
  if (!parent) return true;
  const top = topLevelOf(parent);
  const cached = qc.getQueryData<DirEntry[]>(ghKeys.dir(""));
  if (!cached) return false;
  return cached.some((e) => e.type === "dir" && e.name === top);
}

export async function withSitemap(
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
