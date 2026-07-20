import { fromRuleMarkdown } from "@/features/business-rules/exporters";
import { RuleStatusLabel } from "@/features/business-rules/validations";
import { fromTddMarkdown } from "@/features/tdds/exporters";
import { DocStatusLabel } from "@/features/tdds/validations";
import { fromMarkdown } from "@/features/user-stories/exporters";
import {
  PriorityLabel,
  StatusLabel,
  type Schema,
} from "@/features/user-stories/validations";
import { detectType } from "@/lib/file-type";
import { isSitemapPath } from "./markdown";
import type { SitemapEntry, StorySitemapEntry } from "./types";

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

export function entryFromContent(
  path: string,
  content: string | null,
): SitemapEntry {
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

export function entriesFromContents(
  files: { path: string; content: string }[],
): SitemapEntry[] {
  return files
    .filter(
      (f) => f.path.toLowerCase().endsWith(".md") && !isSitemapPath(f.path),
    )
    .map((f) => entryFromContent(f.path, f.content));
}
