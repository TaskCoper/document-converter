import {
  DocStatus,
  DocStatusLabel,
  pathToLabel,
  tddSchema,
  type TddSchema,
} from "./validations";

// ── Markdown export ─────────────────────────────────────────────

export function toTddMarkdown(data: TddSchema): string {
  const lines: string[] = [];
  const {
    documentInfo,
    contextGoals,
    architecture,
    sequenceDiagram,
    activityDiagram,
    stateDiagram,
    dataModel,
    internalApi,
    externalApi,
    references,
    changeLog,
  } = data;

  lines.push(`# ${documentInfo.docId || "TDD"}`);
  lines.push("");

  // ── Document Info ──
  lines.push("## Document Info");
  lines.push("");
  lines.push(`- **Feature**: ${documentInfo.feature}`);
  lines.push(`- **Author**: ${documentInfo.author}`);
  lines.push(`- **Reviewer**: ${documentInfo.reviewer}`);
  lines.push(`- **Status**: ${DocStatusLabel[documentInfo.status]}`);
  lines.push(`- **Version**: ${documentInfo.version}`);
  lines.push(`- **Updated At**: ${documentInfo.updatedAt}`);
  if (documentInfo.relatedStories.length) {
    lines.push(`- **Related Stories**:`);
    for (const s of documentInfo.relatedStories) lines.push(`  - ${s}`);
  }
  if (documentInfo.businessRules.length) {
    lines.push(`- **Business Rules**:`);
    for (const r of documentInfo.businessRules) lines.push(`  - ${r}`);
  }
  lines.push("");

  // ── Context & Goals ──
  lines.push("## Context & Goals");
  lines.push("");
  lines.push("### Problem");
  lines.push("");
  lines.push(contextGoals.problem);
  lines.push("");
  lines.push("### Goals");
  lines.push("");
  for (const g of contextGoals.goals) lines.push(`- ${g}`);
  lines.push("");
  if (contextGoals.nonGoals.length) {
    lines.push("### Non-goals");
    lines.push("");
    for (const g of contextGoals.nonGoals) lines.push(`- ${g}`);
    lines.push("");
  }

  // ── Diagram sections ──
  const diagramSection = (heading: string, d: TddSchema["architecture"]) => {
    lines.push(`## ${heading}`);
    lines.push("");
    if (d.description) {
      lines.push(d.description);
      lines.push("");
    }
    if (d.mermaid) {
      lines.push("```mermaid");
      lines.push(d.mermaid);
      lines.push("```");
      lines.push("");
    }
    if (d.notes.length) {
      lines.push("**Notes**:");
      lines.push("");
      for (const n of d.notes) lines.push(`- ${n}`);
      lines.push("");
    }
  };

  diagramSection("Architecture", architecture);
  diagramSection("Sequence Diagram", sequenceDiagram);
  diagramSection("Activity Diagram", activityDiagram);
  diagramSection("State Diagram", stateDiagram);
  diagramSection("Data Model", dataModel);

  // ── Internal API ──
  lines.push("## Internal API");
  lines.push("");
  if (internalApi.endpoints.length) {
    lines.push("### Endpoints");
    lines.push("");
    for (const e of internalApi.endpoints) {
      lines.push(`- **${e.method}** \`${e.endpoint}\` — ${e.description}`);
    }
    lines.push("");
  }
  if (internalApi.examples.length) {
    lines.push("### Examples");
    lines.push("");
    for (const ex of internalApi.examples) {
      lines.push(`#### ${ex.title}`);
      lines.push("");
      lines.push("```");
      lines.push(ex.content);
      lines.push("```");
      lines.push("");
    }
  }
  if (internalApi.errorCodes.length) {
    lines.push("### Error Codes");
    lines.push("");
    for (const ec of internalApi.errorCodes) {
      lines.push(`- **${ec.code}** (${ec.http}): ${ec.when}`);
    }
    lines.push("");
  }

  // ── External API ──
  lines.push("## External API");
  lines.push("");
  if (externalApi.endpoints.length) {
    lines.push("### Endpoints");
    lines.push("");
    for (const e of externalApi.endpoints) {
      const note = e.note ? ` (${e.note})` : "";
      lines.push(`- **${e.endpoint}** — ${e.purpose}${note}`);
    }
    lines.push("");
  }
  if (externalApi.fields.length) {
    lines.push("### Fields");
    lines.push("");
    for (const f of externalApi.fields) {
      const note = f.note ? ` (${f.note})` : "";
      lines.push(`- **${f.field}** — ${f.meaning}${note}`);
    }
    lines.push("");
  }
  if (externalApi.errorHandling) {
    lines.push("### Error Handling");
    lines.push("");
    lines.push(externalApi.errorHandling);
    lines.push("");
  }
  if (externalApi.quirks.length) {
    lines.push("### Quirks");
    lines.push("");
    for (const q of externalApi.quirks) lines.push(`- ${q}`);
    lines.push("");
  }

  // ── References ──
  lines.push("## References");
  lines.push("");
  const refPairs: [string, string[]][] = [
    ["User Stories", references.userStories],
    ["Business Rules", references.businessRules],
    ["Use Cases", references.useCases],
    ["Others", references.others],
  ];
  for (const [heading, items] of refPairs) {
    if (!items.length) continue;
    lines.push(`### ${heading}`);
    lines.push("");
    for (const i of items) lines.push(`- ${i}`);
    lines.push("");
  }

  // ── Change Log ──
  if (changeLog.length) {
    lines.push("## Change Log");
    lines.push("");
    for (const c of changeLog) {
      lines.push(`#### ${c.version} (${c.date})`);
      lines.push("");
      lines.push(`- **Change**: ${c.change}`);
      lines.push(`- **Author**: ${c.author}`);
      lines.push("");
    }
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

function parseBulletList(lines: string[]): string[] {
  return lines
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim())
    .filter(Boolean);
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

function joinTextBlock(lines: string[]): string {
  const cleaned: string[] = [];
  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (
      line.startsWith("**") ||
      line.startsWith("- ") ||
      line.startsWith("```") ||
      /^#{1,6}\s/.test(line)
    )
      break;
    cleaned.push(line);
  }
  return cleaned.join("\n").trim();
}

function extractLabeledList(lines: string[], label: string): string[] {
  const marker = `**${label}**:`;
  const result: string[] = [];
  let inside = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === marker) {
      inside = true;
      continue;
    }
    if (!inside) continue;
    if (trimmed.startsWith("- ")) result.push(trimmed.slice(2).trim());
    else if (trimmed.startsWith("**") || /^#{1,6}\s/.test(trimmed)) break;
  }
  return result.filter(Boolean);
}

function parseMermaidBlock(lines: string[]): string {
  let inMermaid = false;
  const buffer: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "```mermaid") {
      inMermaid = true;
    } else if (inMermaid && trimmed === "```") {
      break;
    } else if (inMermaid) {
      buffer.push(line);
    }
  }
  return buffer.join("\n").trim();
}

function parseDiagramSection(section: string[]): TddSchema["architecture"] {
  const description = joinTextBlock(section);
  const mermaid = parseMermaidBlock(section);
  const notes = extractLabeledList(section, "Notes");
  return { description, mermaid, notes };
}

function parseCodeBlocks(lines: string[]): string[] {
  const blocks: string[] = [];
  let inBlock = false;
  let buffer: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      if (inBlock) {
        blocks.push(buffer.join("\n"));
        buffer = [];
        inBlock = false;
      } else {
        inBlock = true;
      }
    } else if (inBlock) {
      buffer.push(line);
    }
  }
  return blocks;
}

const INTERNAL_ENDPOINT_RE =
  /^-\s+\*\*(GET|POST|PUT|PATCH|DELETE)\*\*\s+`([^`]+)`\s+—\s+(.+)$/;
const INTERNAL_ERROR_RE = /^-\s+\*\*([A-Z0-9_]+)\*\*\s+\(([^)]+)\):\s+(.+)$/;

const EXTERNAL_ENDPOINT_RE =
  /^-\s+\*\*(.+?)\*\*\s+—\s+(.+?)(?:\s+\(([^)]+)\))?$/;

export class TddParseError extends Error {
  messages: string[];
  constructor(messages: string[]) {
    super("Dữ liệu không hợp lệ");
    this.messages = messages;
    this.name = "TddParseError";
  }
}

export function fromTddMarkdown(md: string): TddSchema {
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
  const docId = idLine ? idLine.slice(2).trim() : "";

  const h2 = splitByHeading(lines, 2);

  // ── Document Info ──
  const docInfoLines = h2["Document Info"] ?? [];
  let feature = "";
  let author = "";
  let reviewer = "";
  let status: TddSchema["documentInfo"]["status"] = DocStatus.Draft;
  let version = "";
  let updatedAt = "";
  const relatedStories: string[] = [];
  const businessRulesMeta: string[] = [];
  const statusByLabel = invertRecord(DocStatusLabel);

  let listMode: "relatedStories" | "businessRules" | null = null;
  for (const rawLine of docInfoLines) {
    const trimmed = rawLine.trim();
    const kv = parseBoldKey(trimmed);
    if (kv) {
      listMode = null;
      switch (kv.key) {
        case "Feature":
          feature = kv.value;
          break;
        case "Author":
          author = kv.value;
          break;
        case "Reviewer":
          reviewer = kv.value;
          break;
        case "Status":
          status = (statusByLabel[kv.value as keyof typeof statusByLabel] ??
            kv.value) as TddSchema["documentInfo"]["status"];
          break;
        case "Version":
          version = kv.value;
          break;
        case "Updated At":
          updatedAt = kv.value;
          break;
        case "Related Stories":
          if (kv.value) relatedStories.push(kv.value);
          listMode = "relatedStories";
          break;
        case "Business Rules":
          if (kv.value) businessRulesMeta.push(kv.value);
          listMode = "businessRules";
          break;
      }
    } else if (listMode && trimmed.startsWith("- ")) {
      const item = trimmed.slice(2).trim();
      if (!item) continue;
      if (listMode === "relatedStories") relatedStories.push(item);
      else businessRulesMeta.push(item);
    }
  }

  // ── Context & Goals ──
  const ctxH3 = splitByHeading(h2["Context & Goals"] ?? [], 3);
  const problem = (ctxH3["Problem"] ?? [])
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.trim())
    .join("\n")
    .trim();
  const goals = parseBulletList(ctxH3["Goals"] ?? []);
  const nonGoals = parseBulletList(ctxH3["Non-goals"] ?? []);

  const architecture = parseDiagramSection(h2["Architecture"] ?? []);
  const sequenceDiagram = parseDiagramSection(h2["Sequence Diagram"] ?? []);
  const activityDiagram = parseDiagramSection(h2["Activity Diagram"] ?? []);
  const stateDiagram = parseDiagramSection(h2["State Diagram"] ?? []);
  const dataModel = parseDiagramSection(h2["Data Model"] ?? []);

  // ── Internal API ──
  const internalH3 = splitByHeading(h2["Internal API"] ?? [], 3);
  const internalEndpoints = (internalH3["Endpoints"] ?? [])
    .map((l) => l.trim())
    .map((l) => l.match(INTERNAL_ENDPOINT_RE))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({
      method: m[1] as TddSchema["internalApi"]["endpoints"][number]["method"],
      endpoint: m[2],
      description: m[3],
    }));

  const examplesH4 = splitByHeading(internalH3["Examples"] ?? [], 4);
  const internalExamples = Object.entries(examplesH4).map(
    ([title, exampleLines]) => ({
      title,
      content: parseCodeBlocks(exampleLines).join("\n").trim(),
    }),
  );

  const internalErrorCodes = (internalH3["Error Codes"] ?? [])
    .map((l) => l.trim())
    .map((l) => l.match(INTERNAL_ERROR_RE))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({
      code: m[1],
      http: m[2],
      when: m[3],
    }));

  // ── External API ──
  const externalH3 = splitByHeading(h2["External API"] ?? [], 3);
  const externalEndpoints = (externalH3["Endpoints"] ?? [])
    .map((l) => l.trim())
    .map((l) => l.match(EXTERNAL_ENDPOINT_RE))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({
      endpoint: m[1],
      purpose: m[2].trim(),
      note: (m[3] ?? "").trim(),
    }));

  const externalFields = (externalH3["Fields"] ?? [])
    .map((l) => l.trim())
    .map((l) => l.match(EXTERNAL_ENDPOINT_RE))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({
      field: m[1],
      meaning: m[2].trim(),
      note: (m[3] ?? "").trim(),
    }));

  const errorHandling = (externalH3["Error Handling"] ?? [])
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.trim())
    .join("\n")
    .trim();

  const quirks = parseBulletList(externalH3["Quirks"] ?? []);

  // ── References ──
  const refH3 = splitByHeading(h2["References"] ?? [], 3);
  const userStories = parseBulletList(refH3["User Stories"] ?? []);
  const businessRulesRef = parseBulletList(refH3["Business Rules"] ?? []);
  const useCases = parseBulletList(refH3["Use Cases"] ?? []);
  const others = parseBulletList(refH3["Others"] ?? []);

  // ── Change Log ──
  const changeLogH4 = splitByHeading(h2["Change Log"] ?? [], 4);
  const changeLog = Object.entries(changeLogH4).map(([heading, section]) => {
    const m = heading.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    const versionStr = m ? m[1].trim() : heading;
    const date = m ? m[2].trim() : "";
    let change = "";
    let entryAuthor = "";
    for (const line of section) {
      const kv = parseBoldKey(line.trim());
      if (!kv) continue;
      if (kv.key === "Change") change = kv.value;
      else if (kv.key === "Author") entryAuthor = kv.value;
    }
    return { version: versionStr, date, change, author: entryAuthor };
  });

  const data = {
    documentInfo: {
      docId,
      feature,
      author,
      reviewer,
      status,
      version,
      updatedAt,
      relatedStories,
      businessRules: businessRulesMeta,
    },
    contextGoals: { problem, goals, nonGoals },
    architecture,
    sequenceDiagram,
    activityDiagram,
    stateDiagram,
    dataModel,
    internalApi: {
      endpoints: internalEndpoints,
      examples: internalExamples,
      errorCodes: internalErrorCodes,
    },
    externalApi: {
      endpoints: externalEndpoints,
      fields: externalFields,
      errorHandling,
      quirks,
    },
    references: {
      userStories,
      businessRules: businessRulesRef,
      useCases,
      others,
    },
    changeLog,
  };

  const result = tddSchema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => {
      const label = pathToLabel(i.path as (string | number)[]);
      return `${label}: ${i.message}`;
    });
    throw new TddParseError(messages);
  }
  return result.data;
}

// ── Sample markdown template ─────────────────────────────────────

export function toTddSampleMarkdown(): string {
  const lines: string[] = [];

  lines.push("<!--");
  lines.push("  TECHNICAL DESIGN DOCUMENT TEMPLATE");
  lines.push("  ════════════════════════════════════════════════════════════");
  lines.push("  Fill in every field below, then import this file into the");
  lines.push('  VNZ Converter app using the "Nhập MD" button.');
  lines.push("");
  lines.push("  AI PROMPT (copy → paste into ChatGPT / Claude / Gemini):");
  lines.push("  ────────────────────────────────────────────────────────────");
  lines.push('  "Fill in the technical design document template below. Keep');
  lines.push("  every heading, bullet prefix (**Bold**:), and code-fence");
  lines.push("  exactly as-is. Only replace the placeholder text after each");
  lines.push("  colon or inside code fences. Do NOT change enum values —");
  lines.push('  use only the options listed in the comments."');
  lines.push("  ════════════════════════════════════════════════════════════");
  lines.push("-->");
  lines.push("");
  lines.push("# TDD-XXX");
  lines.push(
    "<!-- Replace TDD-XXX with the actual doc ID, e.g. TDD-BAOKIM-001 -->",
  );
  lines.push("");
  lines.push("## Document Info");
  lines.push("");
  lines.push("- **Feature**: ");
  lines.push("- **Author**: ");
  lines.push("- **Reviewer**: ");
  lines.push("<!-- Status: Draft | In Review | Approved -->");
  lines.push("- **Status**: Draft");
  lines.push("- **Version**: v1.0");
  lines.push("<!-- Updated At: YYYY-MM-DD -->");
  lines.push("- **Updated At**: ");
  lines.push("- **Related Stories**:");
  lines.push("  - ");
  lines.push("- **Business Rules**:");
  lines.push("  - ");
  lines.push("");
  lines.push("## Context & Goals");
  lines.push("");
  lines.push("### Problem");
  lines.push("<!-- Why is this design needed? -->");
  lines.push("");
  lines.push("");
  lines.push("### Goals");
  lines.push("<!-- Bulleted goals of this design -->");
  lines.push("");
  lines.push("- ");
  lines.push("");
  lines.push("### Non-goals");
  lines.push("<!-- Optional. Items explicitly out of scope. -->");
  lines.push("");
  lines.push("- ");
  lines.push("");

  const diagramTemplate = (heading: string) => {
    lines.push(`## ${heading}`);
    lines.push(
      `<!-- Free-text description of the ${heading.toLowerCase()} -->`,
    );
    lines.push("");
    lines.push("");
    lines.push("**URL**: ");
    lines.push("");
    lines.push("**Notes**:");
    lines.push("");
    lines.push("- ");
    lines.push("");
  };

  diagramTemplate("Architecture");
  diagramTemplate("Sequence Diagram");
  diagramTemplate("Activity Diagram");
  diagramTemplate("State Diagram");
  diagramTemplate("Data Model");

  lines.push("## Internal API");
  lines.push("");
  lines.push("### Endpoints");
  lines.push("<!-- Format: - **METHOD** `/path` — description -->");
  lines.push("");
  lines.push("- **POST** `/example` — Example endpoint");
  lines.push("");
  lines.push("### Examples");
  lines.push("<!-- One #### heading per example, code inside ``` fences -->");
  lines.push("");
  lines.push("#### POST /example");
  lines.push("");
  lines.push("```");
  lines.push("Request: { }");
  lines.push("Response: { }");
  lines.push("```");
  lines.push("");
  lines.push("### Error Codes");
  lines.push("<!-- Format: - **CODE** (HTTP): when -->");
  lines.push("");
  lines.push("- **ERROR_CODE** (400): Khi nào xảy ra");
  lines.push("");

  lines.push("## External API");
  lines.push("");
  lines.push("### Endpoints");
  lines.push("<!-- Format: - **name** — purpose (note) -->");
  lines.push("");
  lines.push("- **Vendor endpoint** — Mục đích (ghi chú)");
  lines.push("");
  lines.push("### Fields");
  lines.push("<!-- Format: - **field** — meaning (note) -->");
  lines.push("");
  lines.push("- **field_name** — Ý nghĩa (ghi chú)");
  lines.push("");
  lines.push("### Error Handling");
  lines.push("<!-- How partner errors are handled -->");
  lines.push("");
  lines.push("");
  lines.push("### Quirks");
  lines.push("<!-- Bulleted list of unexpected partner behaviors -->");
  lines.push("");
  lines.push("- ");
  lines.push("");

  lines.push("## References");
  lines.push("");
  lines.push("### User Stories");
  lines.push("");
  lines.push("- ");
  lines.push("");
  lines.push("### Business Rules");
  lines.push("");
  lines.push("- ");
  lines.push("");
  lines.push("### Use Cases");
  lines.push("");
  lines.push("- ");
  lines.push("");
  lines.push("### Others");
  lines.push("");
  lines.push("- ");
  lines.push("");

  lines.push("## Change Log");
  lines.push("<!-- Each entry: #### VERSION (YYYY-MM-DD), then bullets -->");
  lines.push("");
  lines.push("#### v1.0 (2026-01-01)");
  lines.push("");
  lines.push("- **Change**: Tạo tài liệu");
  lines.push("- **Author**: ");
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

const TDD_STYLE = `
  * { box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 40px 20px;
    font-size: 11pt;
    line-height: 1.5;
  }
  .doc { max-width: 900px; margin: 0 auto; }
  .doc-title { font-size: 26pt; font-weight: 700; margin: 0 0 24pt; }
  .section {
    font-size: 16pt;
    font-weight: 700;
    padding: 18pt 0 6pt;
    margin: 0;
    border-bottom: 1px solid #eee;
  }
  .subsection { font-size: 13pt; font-weight: 700; padding: 14pt 0 4pt; margin: 0; }
  p.body { padding: 8pt 0; margin: 0; white-space: pre-wrap; }
  p.body + p.body { padding-top: 0; }
  ul.body { padding: 0 0 8pt 24pt; margin: 0; }
  ul.body li { padding: 2pt 0; }
  .info-table { border-collapse: collapse; margin: 8pt 0; }
  .info-table td { border: 1px solid #000; padding: 5pt 8pt; vertical-align: top; }
  .info-table td.k { width: 160px; background: #fafafa; }
  .data-table { width: 100%; border-collapse: collapse; margin: 8pt 0; }
  .data-table th, .data-table td {
    border: 1px solid #000;
    padding: 5pt 8pt;
    vertical-align: top;
    text-align: left;
  }
  .data-table th { background: #f0f0f0; font-weight: 700; text-align: center; }
  .example-title { font-size: 11pt; font-weight: 700; margin: 12pt 0 4pt; }
  .code-block {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 10px;
    font-family: "Roboto Mono", monospace;
    font-size: 9pt;
    white-space: pre;
    overflow-x: auto;
    margin: 0 0 8pt;
  }
  code {
    font-family: "Roboto Mono", monospace;
    background: #f5f5f5;
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 90%;
  }
  a { color: #1155cc; text-decoration: underline; }
  img { max-width: 100%; height: auto; }
`.trim();

function renderParagraph(text: string): string {
  if (!text.trim()) return "";
  return `<p class="body">${escapeHtml(text)}</p>`;
}

function renderBullets(items: string[]): string {
  if (!items.length) return "";
  return `<ul class="body">${items
    .map((i) => `<li>${escapeHtml(i)}</li>`)
    .join("")}</ul>`;
}

function renderHtmlBullets(items: string[]): string {
  if (!items.length) return "";
  return `<ul class="body">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
}

function renderKvTable(rows: [string, string][]): string {
  const body = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td class="k">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  if (!body) return "";
  return `<table class="info-table"><tbody>${body}</tbody></table>`;
}

function renderDataTable(headers: string[], rows: string[][]): string {
  if (!rows.length) return "";
  const thead = `<thead><tr>${headers
    .map((h) => `<th>${escapeHtml(h)}</th>`)
    .join("")}</tr></thead>`;
  const tbody = `<tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;
  return `<table class="data-table">${thead}${tbody}</table>`;
}

function renderDiagramSection(
  num: string,
  label: string,
  d: TddSchema["architecture"],
): string {
  if (!d.description && !d.mermaid && !d.notes.length) return "";
  const parts: string[] = [
    `<h2 class="section">${num}. ${escapeHtml(label)}</h2>`,
  ];
  if (d.description) parts.push(renderParagraph(d.description));
  if (d.mermaid) {
    parts.push(`<pre class="mermaid body">${escapeHtml(d.mermaid)}</pre>`);
  }
  if (d.notes.length) {
    parts.push(`<p class="body"><strong>Ghi chú:</strong></p>`);
    parts.push(renderBullets(d.notes));
  }
  return parts.join("\n");
}

export function toTddHtml(data: TddSchema): string {
  const {
    documentInfo,
    contextGoals,
    architecture,
    sequenceDiagram,
    activityDiagram,
    stateDiagram,
    dataModel,
    internalApi,
    externalApi,
    references,
    changeLog,
  } = data;

  const parts: string[] = [];

  const titleText = documentInfo.feature
    ? `Technical Design Document — ${documentInfo.feature}`
    : documentInfo.docId || "Technical Design Document";
  parts.push(`<h1 class="doc-title">${escapeHtml(titleText)}</h1>`);

  // 1. Thông tin tài liệu
  parts.push(`<h2 class="section">1. Thông tin tài liệu</h2>`);
  parts.push(
    renderKvTable([
      ["Doc ID", documentInfo.docId],
      ["Tính năng", documentInfo.feature],
      ["Tác giả", documentInfo.author],
      ["Reviewer", documentInfo.reviewer],
      ["Trạng thái", DocStatusLabel[documentInfo.status]],
      ["Phiên bản", documentInfo.version],
      ["Cập nhật", documentInfo.updatedAt],
      ["Story liên quan", documentInfo.relatedStories.join(", ")],
      ["Business Rules", documentInfo.businessRules.join(", ")],
    ]),
  );

  // 2. Bối cảnh & Mục tiêu
  parts.push(`<h2 class="section">2. Bối cảnh &amp; Mục tiêu</h2>`);
  if (contextGoals.problem) {
    parts.push(`<h3 class="subsection">2.1. Vấn đề</h3>`);
    parts.push(renderParagraph(contextGoals.problem));
  }
  if (contextGoals.goals.length) {
    parts.push(`<h3 class="subsection">2.2. Mục tiêu (Goals)</h3>`);
    parts.push(renderBullets(contextGoals.goals));
  }
  if (contextGoals.nonGoals.length) {
    parts.push(`<h3 class="subsection">2.3. Ngoài phạm vi (Non-goals)</h3>`);
    parts.push(renderBullets(contextGoals.nonGoals));
  }

  // 3–7. Diagram sections
  parts.push(
    renderDiagramSection(
      "3",
      "Kiến trúc tổng quan (Architecture)",
      architecture,
    ),
  );
  parts.push(renderDiagramSection("4", "Sequence Diagram", sequenceDiagram));
  parts.push(renderDiagramSection("5", "Activity Diagram", activityDiagram));
  parts.push(renderDiagramSection("6", "State Diagram", stateDiagram));
  parts.push(
    renderDiagramSection("7", "Mô hình dữ liệu (Data Model)", dataModel),
  );

  // 8. Internal API
  if (
    internalApi.endpoints.length ||
    internalApi.examples.length ||
    internalApi.errorCodes.length
  ) {
    parts.push(`<h2 class="section">8. API Contract</h2>`);
    if (internalApi.endpoints.length) {
      parts.push(`<h3 class="subsection">8.1. Endpoint</h3>`);
      parts.push(
        renderDataTable(
          ["Endpoint", "Method", "Mô tả"],
          internalApi.endpoints.map((e) => [
            `<code>${escapeHtml(e.endpoint)}</code>`,
            escapeHtml(e.method),
            escapeHtml(e.description),
          ]),
        ),
      );
    }
    if (internalApi.examples.length) {
      parts.push(`<h3 class="subsection">8.2. Ví dụ request/response</h3>`);
      for (const ex of internalApi.examples) {
        parts.push(`<h4 class="example-title">${escapeHtml(ex.title)}</h4>`);
        parts.push(`<pre class="code-block">${escapeHtml(ex.content)}</pre>`);
      }
    }
    if (internalApi.errorCodes.length) {
      parts.push(`<h3 class="subsection">8.3. Error code</h3>`);
      parts.push(
        renderDataTable(
          ["Code", "HTTP", "Khi nào xảy ra"],
          internalApi.errorCodes.map((ec) => [
            `<code>${escapeHtml(ec.code)}</code>`,
            escapeHtml(ec.http),
            escapeHtml(ec.when),
          ]),
        ),
      );
    }
  }

  // 9. External API
  if (
    externalApi.endpoints.length ||
    externalApi.fields.length ||
    externalApi.errorHandling ||
    externalApi.quirks.length
  ) {
    parts.push(
      `<h2 class="section">9. API Contract — bên thứ ba (External)</h2>`,
    );
    if (externalApi.endpoints.length) {
      parts.push(`<h3 class="subsection">9.1. Endpoint sử dụng</h3>`);
      parts.push(
        renderDataTable(
          ["Endpoint", "Mục đích", "Ghi chú"],
          externalApi.endpoints.map((e) => [
            escapeHtml(e.endpoint),
            escapeHtml(e.purpose),
            escapeHtml(e.note),
          ]),
        ),
      );
    }
    if (externalApi.fields.length) {
      parts.push(`<h3 class="subsection">9.2. Field quan trọng</h3>`);
      parts.push(
        renderDataTable(
          ["Field", "Ý nghĩa", "Ghi chú"],
          externalApi.fields.map((f) => [
            `<code>${escapeHtml(f.field)}</code>`,
            escapeHtml(f.meaning),
            escapeHtml(f.note),
          ]),
        ),
      );
    }
    if (externalApi.errorHandling) {
      parts.push(
        `<h3 class="subsection">9.3. Error/response phía đối tác</h3>`,
      );
      parts.push(renderParagraph(externalApi.errorHandling));
    }
    if (externalApi.quirks.length) {
      parts.push(`<h3 class="subsection">9.4. Quirk / cạm bẫy</h3>`);
      parts.push(renderBullets(externalApi.quirks));
    }
  }

  // 10. References
  const refItems: string[] = [];
  if (references.userStories.length) {
    refItems.push(
      `<strong>User Stories:</strong> ${references.userStories
        .map(escapeHtml)
        .join(", ")}`,
    );
  }
  if (references.businessRules.length) {
    refItems.push(
      `<strong>Business Rules:</strong> ${references.businessRules
        .map(escapeHtml)
        .join(", ")}`,
    );
  }
  if (references.useCases.length) {
    refItems.push(
      `<strong>Use Cases:</strong> ${references.useCases
        .map(escapeHtml)
        .join(", ")}`,
    );
  }
  for (const o of references.others) refItems.push(escapeHtml(o));
  if (refItems.length) {
    parts.push(`<h2 class="section">10. Tham chiếu</h2>`);
    parts.push(renderHtmlBullets(refItems));
  }

  // 11. Change log
  if (changeLog.length) {
    parts.push(`<h2 class="section">11. Lịch sử thay đổi</h2>`);
    parts.push(
      renderDataTable(
        ["Ngày", "Phiên bản", "Thay đổi", "Người"],
        changeLog.map((c) => [
          escapeHtml(c.date),
          escapeHtml(c.version),
          escapeHtml(c.change),
          escapeHtml(c.author),
        ]),
      ),
    );
  }

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>${escapeHtml(titleText)}</title>
<style>${TDD_STYLE}</style>
</head>
<body>
<article class="doc">
${parts.filter(Boolean).join("\n")}
</article>
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
