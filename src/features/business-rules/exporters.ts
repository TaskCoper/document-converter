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
  lines.push("  placeholder text after each colon. Do NOT change enum values —");
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
  lines.push("<!-- Optional. Ghi chú, link tới decision table hoặc rule liên quan -->");
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

const RULE_STYLE = `
* { box-sizing: border-box; }
body {
  font-family: Arial, sans-serif;
  color: #000;
  background: #fff;
  margin: 0;
  padding: 16px;
  overflow-x: hidden;
}
.ritz.grid-container {
  overflow-x: auto;
  width: 100%;
}
.ritz .waffle {
  border-collapse: collapse;
  table-layout: fixed;
  width: max-content;
}
.ritz .waffle a { color: inherit; }
.ritz .waffle .s0 {
  background-color: #1f2a37;
  text-align: left;
  font-weight: bold;
  color: #ffffff;
  font-family: Arial;
  font-size: 15pt;
  vertical-align: bottom;
  white-space: nowrap;
  padding: 4px 6px;
}
.ritz .waffle .s1 {
  border-bottom: 1px solid #d9d5cc;
  background-color: #fbe7cc;
  text-align: left;
  font-style: italic;
  color: #6b7280;
  font-family: Arial;
  font-size: 9pt;
  vertical-align: bottom;
  white-space: nowrap;
  padding: 2px 3px;
}
.ritz .waffle .s2 {
  border-bottom: 1px solid #d9d5cc;
  border-right: 1px solid #d9d5cc;
  background-color: #e8a13a;
  text-align: center;
  font-weight: bold;
  color: #ffffff;
  font-family: Arial;
  font-size: 10pt;
  vertical-align: bottom;
  white-space: nowrap;
  padding: 4px 6px;
}
.ritz .waffle .s3 {
  border-bottom: 1px solid #d9d5cc;
  border-right: 1px solid #d9d5cc;
  background-color: #fbe7cc;
  text-align: left;
  font-style: italic;
  color: #6b7280;
  font-family: Arial;
  font-size: 9pt;
  vertical-align: top;
  white-space: nowrap;
  padding: 4px 6px;
}
.ritz .waffle .s4 {
  border-bottom: 1px solid #d9d5cc;
  border-right: 1px solid #d9d5cc;
  background-color: #fbe7cc;
  text-align: center;
  font-style: italic;
  color: #6b7280;
  font-family: Arial;
  font-size: 9pt;
  vertical-align: top;
  white-space: nowrap;
  padding: 4px 6px;
}
.ritz .waffle .s5 {
  border-bottom: 1px solid #d9d5cc;
  border-right: 1px solid #d9d5cc;
  background-color: #fbe7cc;
  text-align: left;
  font-style: italic;
  color: #6b7280;
  font-family: Arial;
  font-size: 9pt;
  vertical-align: top;
  white-space: normal;
  word-wrap: break-word;
  padding: 4px 6px;
}
`.trim();

const HEADERS: { label: string; width: number }[] = [
  { label: "Rule ID", width: 90 },
  { label: "Tên rule", width: 170 },
  { label: "Danh mục", width: 140 },
  { label: "Phát biểu (Statement)", width: 340 },
  { label: "Điều kiện (When)", width: 260 },
  { label: "Hành vi (Then)", width: 320 },
  { label: "Ngoại lệ (Except)", width: 320 },
  { label: "Nguồn", width: 200 },
  { label: "Người sở hữu", width: 130 },
  { label: "Story liên quan", width: 160 },
  { label: "Trạng thái", width: 100 },
  { label: "Version", width: 90 },
  { label: "Ngày hiệu lực", width: 110 },
  { label: "Ghi chú / Link logic", width: 240 },
];

const COL_COUNT = HEADERS.length;

export function toRuleHtml(data: RuleSchema): string {
  const dataCells: { content: string; cls: string }[] = [
    { content: escapeHtml(data.ruleId), cls: "s3" },
    { content: escapeHtml(data.name), cls: "s3" },
    { content: escapeHtml(data.category), cls: "s4" },
    { content: escapeHtml(data.statement), cls: "s5" },
    { content: escapeHtml(data.when), cls: "s3" },
    { content: escapeHtml(data.then), cls: "s3" },
    { content: escapeHtml(data.except), cls: "s3" },
    { content: escapeHtml(data.source), cls: "s3" },
    { content: escapeHtml(data.owner), cls: "s3" },
    { content: escapeHtml(data.relatedStories.join(", ")), cls: "s3" },
    { content: escapeHtml(RuleStatusLabel[data.status]), cls: "s4" },
    { content: escapeHtml(data.version), cls: "s4" },
    { content: escapeHtml(data.effectiveDate), cls: "s4" },
    { content: escapeHtml(data.notes), cls: "s3" },
  ];

  const colgroup = `<colgroup>${HEADERS.map(
    (h) => `<col style="width:${h.width}px">`,
  ).join("")}</colgroup>`;

  const titleRow = `<tr><td class="s0" colspan="${COL_COUNT}">BUSINESS RULES REGISTER</td></tr>`;

  const subtitleRow = `<tr><td class="s1" colspan="${COL_COUNT}">Kho rule tập trung — mỗi rule 1 dòng, 1 nguồn chân lý duy nhất. Story chỉ THAM CHIẾU bằng Rule ID, không chép nội dung. Rule nhiều nhánh (decision table) → tách file chi tiết, ghi link ở cột cuối.</td></tr>`;

  const headerRow = `<tr>${HEADERS.map(
    (h) => `<td class="s2">${escapeHtml(h.label)}</td>`,
  ).join("")}</tr>`;

  const dataRow = `<tr>${dataCells
    .map((c) => `<td class="${c.cls}">${c.content}</td>`)
    .join("")}</tr>`;

  const title = `Business Rule — ${data.ruleId || "BR"}`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>${RULE_STYLE}</style>
</head>
<body>
<div class="ritz grid-container" dir="ltr">
<table class="waffle" cellspacing="0" cellpadding="0">
${colgroup}
<tbody>
${titleRow}
${subtitleRow}
${headerRow}
${dataRow}
</tbody>
</table>
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
