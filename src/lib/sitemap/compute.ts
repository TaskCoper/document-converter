import { type Change, GhError, getFile, listDir } from "@/lib/github";
import { entryFromContent } from "./entry";
import {
  SITEMAP_FILENAME,
  buildRootSitemapMarkdown,
  buildSitemapMarkdown,
  isSitemapPath,
  parseRootSitemapMarkdown,
  parseSitemapMarkdown,
  sitemapPathFor,
  sortTypes,
} from "./markdown";
import type {
  RootSitemapComputeOpts,
  RootSitemapFolder,
  RootSitemapOverrides,
  SitemapEntry,
} from "./types";

export async function collectFolderContents(
  folder: string,
): Promise<{ path: string; content: string }[]> {
  const folderEntries = await listDir(folder);
  const mdFiles = folderEntries.filter(
    (e) =>
      e.type === "file" &&
      e.name.toLowerCase().endsWith(".md") &&
      e.name.toLowerCase() !== SITEMAP_FILENAME,
  );

  return Promise.all(
    mdFiles.map(async (file) => {
      const data = await getFile(file.path);
      return { path: file.path, content: data?.content ?? "" };
    }),
  );
}

async function collectFolderEntries(folder: string): Promise<SitemapEntry[]> {
  const files = await collectFolderContents(folder);
  return files.map((f) => entryFromContent(f.path, f.content));
}

export async function computeSitemapChangeFromContents(
  folder: string,
  files: { path: string; content: string }[],
): Promise<Change | null> {
  const clean = folder.replace(/^\/+|\/+$/g, "");
  if (!clean) return null;
  const path = sitemapPathFor(clean);

  const mdFiles = files.filter(
    (f) => f.path.toLowerCase().endsWith(".md") && !isSitemapPath(f.path),
  );
  const entries = mdFiles.map((f) => entryFromContent(f.path, f.content));

  const existing = await getFile(path);
  if (entries.length === 0) {
    return existing ? { action: "delete", path } : null;
  }
  const content = buildSitemapMarkdown(clean, entries);
  if (existing && existing.content === content) return null;
  return { action: "upsert", path, content };
}

async function loadFolderEntriesForRoot(
  folder: string,
): Promise<SitemapEntry[]> {
  const smPath = sitemapPathFor(folder);
  const sm = await getFile(smPath);
  if (sm) return parseSitemapMarkdown(sm.content);
  try {
    return await collectFolderEntries(folder);
  } catch (e) {
    if (e instanceof GhError && e.kind === "NOT_FOUND") return [];
    throw e;
  }
}

export async function computeRootSitemapChange(
  overrides: RootSitemapOverrides = {},
  opts: RootSitemapComputeOpts = {},
): Promise<Change | null> {
  const rootPath = sitemapPathFor("");
  const existing = await getFile(rootPath);

  if (opts.trustExistingRoot && existing) {
    const parsed = parseRootSitemapMarkdown(existing.content);
    const map = new Map<string, RootSitemapFolder>(
      parsed.map((f) => [f.name, f]),
    );
    overrides.upserts?.forEach((entries, name) => {
      map.set(name, {
        name,
        types: sortTypes(entries.map((e) => e.type)),
        count: entries.length,
      });
    });
    overrides.deletedFolders?.forEach((f) => map.delete(f));
    const sorted = Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    if (sorted.length === 0) {
      return { action: "delete", path: rootPath };
    }
    const content = buildRootSitemapMarkdown(sorted);
    if (existing.content === content) return null;
    return { action: "upsert", path: rootPath, content };
  }

  let rootEntries: { name: string; type: "file" | "dir" }[] = [];
  try {
    rootEntries = await listDir("");
  } catch (e) {
    if (!(e instanceof GhError && e.kind === "NOT_FOUND")) throw e;
  }

  const folderNames = new Set(
    rootEntries.filter((e) => e.type === "dir").map((e) => e.name),
  );
  overrides.deletedFolders?.forEach((f) => folderNames.delete(f));
  overrides.upserts?.forEach((_, f) => folderNames.add(f));

  const sorted = Array.from(folderNames).sort((a, b) => a.localeCompare(b));
  const infos: RootSitemapFolder[] = await Promise.all(
    sorted.map(async (name) => {
      const entries = overrides.upserts?.has(name)
        ? overrides.upserts.get(name)!
        : await loadFolderEntriesForRoot(name);
      return {
        name,
        types: sortTypes(entries.map((e) => e.type)),
        count: entries.length,
      };
    }),
  );

  if (infos.length === 0) {
    return existing ? { action: "delete", path: rootPath } : null;
  }

  const content = buildRootSitemapMarkdown(infos);
  if (existing && existing.content === content) return null;
  return { action: "upsert", path: rootPath, content };
}

export async function computeSitemapChange(
  folder: string,
): Promise<Change | null> {
  const clean = folder.replace(/^\/+|\/+$/g, "");
  if (!clean) return null;

  const path = sitemapPathFor(clean);
  let entries: SitemapEntry[];
  try {
    entries = await collectFolderEntries(clean);
  } catch (e) {
    // Folder no longer exists (e.g. after rename/move). If a sitemap still
    // lingers there, emit a delete so it gets cleaned up in the same commit.
    const existing = await getFile(path);
    if (existing) return { action: "delete", path };
    throw e;
  }
  const content = buildSitemapMarkdown(clean, entries);
  const existing = await getFile(path);

  if (existing && existing.content === content) return null;
  if (!existing && entries.length === 0) return null;

  return { action: "upsert", path, content };
}
