import {
  RuleStatus,
  RuleStatusLabel,
  pathToLabel,
  ruleSchema,
  type RuleSchema,
} from "./validations";

// ── Markdown export ─────────────────────────────────────────────

export function toRuleMarkdown(data: RuleSchema): string {
  const lines: string[] = [];

  lines.push(`# ${data.ruleId || "BR"}`);
  lines.push("");

  lines.push("## Rule Info");
  lines.push("");
  lines.push(`- **Name**: ${data.name}`);
  lines.push(`- **Category**: ${data.category}`);
  lines.push(`- **Status**: ${RuleStatusLabel[data.status]}`);
  lines.push(`- **Version**: ${data.version}`);
  lines.push(`- **Effective Date**: ${data.effectiveDate}`);
  lines.push(`- **Owner**: ${data.owner}`);
  lines.push(`- **Source**: ${data.source}`);
  if (data.relatedStories.length) {
    lines.push(`- **Related Stories**:`);
    for (const s of data.relatedStories) lines.push(`  - ${s}`);
  }
  lines.push("");

  lines.push("## Statement");
  lines.push("");
  lines.push(data.statement);
  lines.push("");

  lines.push("## When");
  lines.push("");
  lines.push(data.when);
  lines.push("");

  lines.push("## Then");
  lines.push("");
  lines.push(data.then);
  lines.push("");

  if (data.except.trim()) {
    lines.push("## Except");
    lines.push("");
    lines.push(data.except);
    lines.push("");
  }

  if (data.notes.trim()) {
    lines.push("## Notes");
    lines.push("");
    lines.push(data.notes);
    lines.push("");
  }

  return lines.join("\n");
}

// ── Markdown parsing ────────────────────────────────────────────

function splitByHeading(
  lines: string[],
  level: number,
): Record<string, string[]> {
  const prefix = "#".repeat(level) + " ";
  const result: Record<string, string[]> = {};
  let current: string | null = null;
  for (const line of lines) {
    if (line.startsWith(prefix)) {
      current = line.slice(prefix.length).trim();
      result[current] = [];
    } else if (current !== null) {
      result[current].push(line);
    }
  }
  return result;
}

function parseBoldKey(line: string): { key: string; value: string } | null {
  const m = line.match(/^-\s+\*\*(.+?)\*\*:\s*(.*)$/);
  return m ? { key: m[1], value: m[2].trim() } : null;
}

function invertRecord<K extends string, V extends string>(
  record: Record<K, V>,
): Record<V, K> {
  return Object.fromEntries(
    Object.entries(record).map(([k, v]) => [v, k]),
  ) as Record<V, K>;
}

function joinBlock(lines: string[]): string {
  return lines
    .map((l) => l.replace(/\r$/, ""))
    .join("\n")
    .replace(/^\n+|\n+$/g, "")
    .trim();
}

export class RuleParseError extends Error {
  messages: string[];
  constructor(messages: string[]) {
    super("Dữ liệu không hợp lệ");
    this.messages = messages;
    this.name = "RuleParseError";
  }
}

export function fromRuleMarkdown(md: string): RuleSchema {
  let inComment = false;
  const lines = md.split("\n").filter((line) => {
    if (line.includes("<!--")) inComment = true;
    if (inComment) {
      if (line.includes("-->")) inComment = false;
      return false;
    }
    return true;
  });

  const idLine = lines.find((l) => l.startsWith("# "));
  const ruleId = idLine ? idLine.slice(2).trim() : "";

  const h2 = splitByHeading(lines, 2);

  const infoLines = h2["Rule Info"] ?? [];
  let name = "";
  let category = "";
  let status: RuleSchema["status"] = RuleStatus.Draft;
  let version = "";
  let effectiveDate = "";
  let owner = "";
  let source = "";
  const relatedStories: string[] = [];
  const statusByLabel = invertRecord(RuleStatusLabel);

  let inRelated = false;
  for (const rawLine of infoLines) {
    const trimmed = rawLine.trim();
    const kv = parseBoldKey(trimmed);
    if (kv) {
      inRelated = false;
      switch (kv.key) {
        case "Name":
          name = kv.value;
          break;
        case "Category":
          category = kv.value;
          break;
        case "Status":
          status = (statusByLabel[kv.value as keyof typeof statusByLabel] ??
            kv.value) as RuleSchema["status"];
          break;
        case "Version":
          version = kv.value;
          break;
        case "Effective Date":
          effectiveDate = kv.value;
          break;
        case "Owner":
          owner = kv.value;
          break;
        case "Source":
          source = kv.value;
          break;
        case "Related Stories":
          if (kv.value) relatedStories.push(kv.value);
          inRelated = true;
          break;
      }
    } else if (inRelated && trimmed.startsWith("- ")) {
      const item = trimmed.slice(2).trim();
      if (item) relatedStories.push(item);
    }
  }

  const statement = joinBlock(h2["Statement"] ?? []);
  const when = joinBlock(h2["When"] ?? []);
  const then = joinBlock(h2["Then"] ?? []);
  const except = joinBlock(h2["Except"] ?? []);
  const notes = joinBlock(h2["Notes"] ?? []);

  const data = {
    ruleId,
    name,
    category,
    statement,
    when,
    then,
    except,
    source,
    owner,
    relatedStories,
    status,
    version,
    effectiveDate,
    notes,
  };

  const result = ruleSchema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => {
      const label = pathToLabel(i.path as (string | number)[]);
      return `${label}: ${i.message}`;
    });
    throw new RuleParseError(messages);
  }
  return result.data;
}

// ── Sample markdown template ─────────────────────────────────────

export function toRuleSampleMarkdown(): string {
  const lines: string[] = [];

  lines.push("<!--");
  lines.push("  BUSINESS RULE TEMPLATE");
  lines.push("  ════════════════════════════════════════════════════════════");
  lines.push("  Fill in every field below, then import this file into the");
  lines.push('  VNZ Converter app using the "Nhập MD" button.');
  lines.push("");
  lines.push("  AI PROMPT (copy → paste into ChatGPT / Claude / Gemini):");
  lines.push("  ────────────────────────────────────────────────────────────");
  lines.push('  "Fill in the business rule template below. Keep every heading');
  lines.push("  and bullet prefix (**Bold**:) exactly as-is. Only replace the");
  lines.push(
    "  placeholder text after each colon. Do NOT change enum values —",
  );
  lines.push('  use only the options listed in the comments."');
  lines.push("  ════════════════════════════════════════════════════════════");
  lines.push("-->");
  lines.push("");
  lines.push("# BR-XXX");
  lines.push("<!-- Replace BR-XXX with the actual rule ID, e.g. BR-07 -->");
  lines.push("");
  lines.push("## Rule Info");
  lines.push("");
  lines.push("- **Name**: ");
  lines.push("- **Category**: ");
  lines.push("<!-- Status: Draft | In Review | Active | Deprecated -->");
  lines.push("- **Status**: Draft");
  lines.push("- **Version**: v1.0");
  lines.push("<!-- Effective Date: YYYY-MM-DD -->");
  lines.push("- **Effective Date**: ");
  lines.push("- **Owner**: ");
  lines.push("- **Source**: ");
  lines.push("- **Related Stories**:");
  lines.push("  - ");
  lines.push("");
  lines.push("## Statement");
  lines.push("<!-- Phát biểu ngắn gọn nội dung của rule -->");
  lines.push("");
  lines.push("");
  lines.push("## When");
  lines.push("<!-- Điều kiện áp dụng rule -->");
  lines.push("");
  lines.push("");
  lines.push("## Then");
  lines.push("<!-- Hành vi hệ thống khi điều kiện thoả -->");
  lines.push("");
  lines.push("");
  lines.push("## Except");
  lines.push("<!-- Optional. Ngoại lệ / trường hợp không áp dụng -->");
  lines.push("");
  lines.push("");
  lines.push("## Notes");
  lines.push(
    "<!-- Optional. Ghi chú, link tới decision table hoặc rule liên quan -->",
  );
  lines.push("");
  lines.push("");

  return lines.join("\n");
}

// ── HTML export ─────────────────────────────────────────────────

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const nl2br = (s: string): string => escapeHtml(s).replace(/\n/g, "<br>");

const STATUS_COLORS: Record<string, string> = {
  Active: "#16a34a",
  Draft: "#6b7280",
  "In Review": "#d97706",
  Deprecated: "#dc2626",
};

const RULE_STYLE = `
* { box-sizing: border-box; }
body {
  font-family: Arial, sans-serif;
  color: #111827;
  background: #f9fafb;
  margin: 0;
  padding: 24px 20px;
}
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  max-width: 860px;
  margin: 0 auto;
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
}
.card-header {
  background: #1f2a37;
  padding: 20px 24px 16px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.rule-id {
  background: #e8a13a;
  color: #fff;
  font-weight: bold;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 4px;
  white-space: nowrap;
  margin-top: 2px;
}
.rule-name {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  line-height: 1.3;
}
.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
}
.meta-cell {
  padding: 10px 16px;
  border-right: 1px solid #e5e7eb;
}
.meta-cell:last-child { border-right: none; }
.meta-label {
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: #6b7280;
  margin-bottom: 2px;
}
.meta-value {
  font-size: 13px;
  color: #111827;
}
.status-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: bold;
  color: #fff;
}
.sections { padding: 0 24px 20px; }
.section {
  border-left: 3px solid #e8a13a;
  margin: 16px 0 0;
  padding: 10px 14px;
  background: #fffbf5;
  border-radius: 0 6px 6px 0;
}
.section-label {
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #e8a13a;
  margin-bottom: 4px;
}
.section-body {
  font-size: 13px;
  line-height: 1.6;
  color: #111827;
  white-space: pre-wrap;
  word-break: break-word;
}
.section.except { border-color: #6b7280; background: #f9fafb; }
.section.except .section-label { color: #6b7280; }
.section.notes { border-color: #93c5fd; background: #eff6ff; }
.section.notes .section-label { color: #2563eb; }
.stories {
  margin: 16px 0 0;
  padding: 10px 14px;
  border-top: 1px solid #e5e7eb;
}
.stories-label {
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #6b7280;
  margin-bottom: 6px;
}
.story-pill {
  display: inline-block;
  background: #fbe7cc;
  color: #92400e;
  border: 1px solid #e8a13a;
  border-radius: 999px;
  font-size: 11px;
  padding: 2px 10px;
  margin: 2px 4px 2px 0;
}
`.trim();

export function toRuleHtml(data: RuleSchema): string {
  const statusLabel = RuleStatusLabel[data.status];
  const statusColor = STATUS_COLORS[statusLabel] ?? "#6b7280";

  const metaCells = [
    { label: "Danh mục", value: escapeHtml(data.category) },
    {
      label: "Trạng thái",
      value: `<span class="status-badge" style="background:${statusColor}">${escapeHtml(statusLabel)}</span>`,
    },
    { label: "Version", value: escapeHtml(data.version) },
    { label: "Ngày hiệu lực", value: escapeHtml(data.effectiveDate) },
    { label: "Người sở hữu", value: escapeHtml(data.owner) },
    { label: "Nguồn", value: escapeHtml(data.source) },
  ];

  const metaHtml = metaCells
    .map(
      (c) =>
        `<div class="meta-cell"><div class="meta-label">${c.label}</div><div class="meta-value">${c.value}</div></div>`,
    )
    .join("");

  const mainSections = [
    { label: "Phát biểu (Statement)", body: nl2br(data.statement), cls: "" },
    { label: "Điều kiện (When)", body: nl2br(data.when), cls: "" },
    { label: "Hành vi (Then)", body: nl2br(data.then), cls: "" },
  ];

  const optionalSections = [
    {
      label: "Ngoại lệ (Except)",
      body: nl2br(data.except),
      cls: "except",
      show: !!data.except.trim(),
    },
    {
      label: "Ghi chú / Link logic",
      body: nl2br(data.notes),
      cls: "notes",
      show: !!data.notes.trim(),
    },
  ];

  const sectionsHtml = [
    ...mainSections.map(
      (s) =>
        `<div class="section ${s.cls}"><div class="section-label">${s.label}</div><div class="section-body">${s.body}</div></div>`,
    ),
    ...optionalSections
      .filter((s) => s.show)
      .map(
        (s) =>
          `<div class="section ${s.cls}"><div class="section-label">${s.label}</div><div class="section-body">${s.body}</div></div>`,
      ),
  ].join("");

  const storiesHtml =
    data.relatedStories.length > 0
      ? `<div class="stories"><div class="stories-label">Story liên quan</div>${data.relatedStories.map((s) => `<span class="story-pill">${escapeHtml(s)}</span>`).join("")}</div>`
      : "";

  const title = `Business Rule — ${data.ruleId || "BR"}`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>${RULE_STYLE}</style>
</head>
<body>
<div class="card">
  <div class="card-header">
    <div class="rule-id">${escapeHtml(data.ruleId)}</div>
    <div class="rule-name">${escapeHtml(data.name)}</div>
  </div>
  <div class="meta-grid">${metaHtml}</div>
  <div class="sections">
    ${sectionsHtml}
    ${storiesHtml}
  </div>
</div>
</body>
</html>
`;
}

export function downloadFile(
  filename: string,
  content: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
