import { fromMarkdown } from "@/features/user-stories/exporters";
import { fromTddMarkdown } from "@/features/tdds/exporters";
import { fromRuleMarkdown } from "@/features/business-rules/exporters";
import { detectType, type FileType } from "@/lib/file-type";
import { type Change, getFile, listDir } from "@/lib/github";
import {
  PriorityLabel,
  StatusLabel,
  type Schema,
} from "@/features/user-stories/validations";
import { DocStatusLabel } from "@/features/tdds/validations";
import { RuleStatusLabel } from "@/features/business-rules/validations";

const SITEMAP_FILENAME = "sitemap.md";

export type StorySitemapEntry = {
  type: "user-story";
  id: string;
  path: string;
  story: string;
  sprint: string;
  priority: string;
  status: string;
  assignee: string;
  creator: string;
};

export type TddSitemapEntry = {
  type: "tdd";
  id: string;
  path: string;
  feature: string;
  status: string;
  version: string;
  author: string;
  reviewer: string;
  updatedAt: string;
};

export type RuleSitemapEntry = {
  type: "business-rule";
  id: string;
  path: string;
  name: string;
  category: string;
  status: string;
  version: string;
  owner: string;
  effectiveDate: string;
};

export type SitemapEntry =
  | StorySitemapEntry
  | TddSitemapEntry
  | RuleSitemapEntry;

const SEP = " · ";

export function sitemapPathFor(folder: string): string {
  const clean = folder.replace(/^\/+|\/+$/g, "");
  return clean ? `${clean}/${SITEMAP_FILENAME}` : SITEMAP_FILENAME;
}

export function isSitemapPath(path: string): boolean {
  const clean = path.replace(/^\/+|\/+$/g, "").toLowerCase();
  return clean === SITEMAP_FILENAME || clean.endsWith(`/${SITEMAP_FILENAME}`);
}

function entryMetaFields(e: SitemapEntry): string[] {
  if (e.type === "tdd") {
    return [e.feature, e.status, e.version, e.author, e.reviewer, e.updatedAt];
  }
  if (e.type === "business-rule") {
    return [e.name, e.category, e.status, e.version, e.owner, e.effectiveDate];
  }
  return [
    e.story,
    e.sprint ? `Sprint ${e.sprint}` : "",
    e.priority,
    e.status,
    e.assignee,
    e.creator,
  ];
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
    const meta = entryMetaFields(e).filter(Boolean);
    const suffix = meta.length ? ` — ${meta.join(SEP)}` : "";
    lines.push(`- [${e.id}](${e.path}) \`${e.type}\`${suffix}`);
  }

  return lines.join("\n");
}

const ROW_RE =
  /^-\s+\[(.+?)\]\((.+?)\)(?:\s+`(user-story|tdd|business-rule)`)?(?:\s+—\s+(.+))?$/;

export function parseSitemapMarkdown(md: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    const item = line.match(ROW_RE);
    if (!item) continue;

    const [, id, path, rawType, metaStr = ""] = item;
    const type: FileType =
      rawType === "tdd"
        ? "tdd"
        : rawType === "business-rule"
          ? "business-rule"
          : "user-story";
    const parts = metaStr.split(SEP).map((s) => s.trim());

    if (type === "tdd") {
      const [
        feature = "",
        status = "",
        version = "",
        author = "",
        reviewer = "",
        updatedAt = "",
      ] = parts;
      entries.push({
        type: "tdd",
        id,
        path,
        feature,
        status,
        version,
        author,
        reviewer,
        updatedAt,
      });
    } else if (type === "business-rule") {
      const [
        name = "",
        category = "",
        status = "",
        version = "",
        owner = "",
        effectiveDate = "",
      ] = parts;
      entries.push({
        type: "business-rule",
        id,
        path,
        name,
        category,
        status,
        version,
        owner,
        effectiveDate,
      });
    } else {
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
        type: "user-story",
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
  }

  return entries;
}

function storyEntry(
  path: string,
  fallbackId: string,
  meta: Schema["metadata"] | null,
): StorySitemapEntry {
  return {
    type: "user-story",
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

function entryFromContent(path: string, content: string | null): SitemapEntry {
  const baseName = path.split("/").pop() ?? path;
  const fallbackId = baseName.replace(/\.md$/i, "");

  const type = content ? detectType(content) : null;

  if (type === "tdd" && content) {
    try {
      const info = fromTddMarkdown(content).documentInfo;
      return {
        type: "tdd",
        id: info.docId || fallbackId,
        path,
        feature: info.feature,
        status: DocStatusLabel[info.status],
        version: info.version,
        author: info.author,
        reviewer: info.reviewer,
        updatedAt: info.updatedAt,
      };
    } catch {
      return {
        type: "tdd",
        id: fallbackId,
        path,
        feature: "",
        status: "",
        version: "",
        author: "",
        reviewer: "",
        updatedAt: "",
      };
    }
  }

  if (type === "business-rule" && content) {
    try {
      const rule = fromRuleMarkdown(content);
      return {
        type: "business-rule",
        id: rule.ruleId || fallbackId,
        path,
        name: rule.name,
        category: rule.category,
        status: RuleStatusLabel[rule.status],
        version: rule.version,
        owner: rule.owner,
        effectiveDate: rule.effectiveDate,
      };
    } catch {
      return {
        type: "business-rule",
        id: fallbackId,
        path,
        name: "",
        category: "",
        status: "",
        version: "",
        owner: "",
        effectiveDate: "",
      };
    }
  }

  let meta: Schema["metadata"] | null = null;
  if (content !== null) {
    try {
      meta = fromMarkdown(content).metadata;
    } catch {
      meta = null;
    }
  }
  return storyEntry(path, fallbackId, meta);
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
