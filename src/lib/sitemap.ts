import { fromMarkdown } from "@/exporters";
import { type Change, getFile, listDir } from "@/lib/github";
import { PriorityLabel, StatusLabel, type Schema } from "@/validations";

const SITEMAP_FILENAME = "sitemap.md";

export type SitemapEntry = {
  id: string;
  path: string;
  story: string;
  sprint: string;
  priority: string;
  status: string;
  assignee: string;
  creator: string;
};

const SEP = " · ";

export function sitemapPathFor(folder: string): string {
  const clean = folder.replace(/^\/+|\/+$/g, "");
  return clean ? `${clean}/${SITEMAP_FILENAME}` : SITEMAP_FILENAME;
}

export function isSitemapPath(path: string): boolean {
  const clean = path.replace(/^\/+|\/+$/g, "").toLowerCase();
  return clean === SITEMAP_FILENAME || clean.endsWith(`/${SITEMAP_FILENAME}`);
}

export function buildSitemapMarkdown(
  folder: string,
  entries: SitemapEntry[],
): string {
  const lines: string[] = [
    `# ${folder}`,
    "",
    "_Auto-generated. Do not edit manually._",
    "",
  ];

  for (const e of entries) {
    const meta = [
      e.story,
      e.sprint ? `Sprint ${e.sprint}` : "",
      e.priority,
      e.status,
      e.assignee,
      e.creator,
    ].filter(Boolean);
    const suffix = meta.length ? ` — ${meta.join(SEP)}` : "";
    lines.push(`- [${e.id}](${e.path})${suffix}`);
  }

  return lines.join("\n");
}

export function parseSitemapMarkdown(md: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    const item = line.match(/^-\s+\[(.+?)\]\((.+?)\)(?:\s+—\s+(.+))?$/);
    if (!item) continue;

    const [, id, path, metaStr = ""] = item;
    const parts = metaStr.split(SEP).map((s) => s.trim());
    const [
      story = "",
      sprintPart = "",
      priority = "",
      status = "",
      assignee = "",
      creator = "",
    ] = parts;
    const sprint = sprintPart.replace(/^Sprint\s+/i, "");

    entries.push({
      id,
      path,
      story,
      sprint,
      priority,
      status,
      assignee,
      creator,
    });
  }

  return entries;
}

function entryFromContent(path: string, content: string | null): SitemapEntry {
  const baseName = path.split("/").pop() ?? path;
  let meta: Schema["metadata"] | null = null;
  if (content !== null) {
    try {
      meta = fromMarkdown(content).metadata;
    } catch {
      meta = null;
    }
  }
  const fallbackId = baseName.replace(/\.md$/i, "");
  return {
    id: meta?.id || fallbackId,
    path,
    story: meta?.story ?? "",
    sprint: meta ? String(meta.sprint) : "",
    priority: meta ? PriorityLabel[meta.priority] : "",
    status: meta ? StatusLabel[meta.status] : "",
    assignee: meta?.assignee.map((a) => a.name).join(", ") ?? "",
    creator: meta?.creator ?? "",
  };
}

async function collectFolderEntries(folder: string): Promise<SitemapEntry[]> {
  const files = await collectFolderContents(folder);
  return files.map((f) => entryFromContent(f.path, f.content));
}

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
