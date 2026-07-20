import type { FileType } from "@/lib/file-type";
import type {
  RootSitemapFolder,
  SitemapEntry,
} from "./types";

export const SITEMAP_FILENAME = "sitemap.md";
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

const TYPE_ORDER: Record<FileType, number> = {
  "user-story": 0,
  tdd: 1,
  "business-rule": 2,
};

export function sortTypes(types: FileType[]): FileType[] {
  return Array.from(new Set(types)).sort((a, b) => TYPE_ORDER[a] - TYPE_ORDER[b]);
}

export function buildRootSitemapMarkdown(folders: RootSitemapFolder[]): string {
  const lines: string[] = [
    "# Docs",
    "",
    "_Auto-generated. Do not edit manually._",
    "",
    "Root index of documentation folders. Each entry declares which document",
    "types live in that folder so tooling can resolve type by folder name.",
    "",
  ];

  for (const f of folders) {
    const typesStr = f.types.length
      ? f.types.map((t) => `\`${t}\``).join(", ")
      : "`empty`";
    const count = f.count === 1 ? "1 file" : `${f.count} files`;
    lines.push(
      `- [${f.name}](${f.name}/${SITEMAP_FILENAME}) ${typesStr} — ${count}`,
    );
  }

  return lines.join("\n");
}

const ROOT_ROW_RE =
  /^-\s+\[(.+?)\]\((.+?)\)\s+((?:`(?:user-story|tdd|business-rule|empty)`(?:,\s*)?)+)(?:\s+—\s+(\d+)\s+files?)?$/;

export function parseRootSitemapMarkdown(md: string): RootSitemapFolder[] {
  const out: RootSitemapFolder[] = [];
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    const m = line.match(ROOT_ROW_RE);
    if (!m) continue;
    const [, name, , typesStr, countStr] = m;
    const types = Array.from(typesStr.matchAll(/`([^`]+)`/g))
      .map((t) => t[1])
      .filter((t): t is FileType =>
        t === "user-story" || t === "tdd" || t === "business-rule",
      );
    out.push({
      name,
      types: sortTypes(types),
      count: countStr ? Number(countStr) : 0,
    });
  }
  return out;
}
