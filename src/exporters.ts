import {
  CriteriaCondition,
  CriteriaConditionLabel,
  PositionLabel,
  PriorityLabel,
  StatusLabel,
  pathToLabel,
  schema,
  type Schema,
} from "./validations";

export function toMarkdown(data: Schema): string {
  const { metadata, conditions, flow, acceptanceCriteria } = data;
  const lines: string[] = [];

  lines.push(`# ${metadata.id || "User Story"}`);
  lines.push("");

  lines.push("## Metadata");
  lines.push("");
  lines.push(`- **Story**: ${metadata.story}`);
  lines.push(`- **Context**: ${metadata.context}`);
  lines.push(`- **Sprint**: ${metadata.sprint}`);
  lines.push(`- **Priority**: ${PriorityLabel[metadata.priority]}`);
  lines.push(`- **Status**: ${StatusLabel[metadata.status]}`);
  lines.push(`- **Creator**: ${metadata.creator}`);
  if (metadata.assignee.length) {
    lines.push(`- **Assignee**:`);
    for (const a of metadata.assignee) {
      lines.push(`  - ${PositionLabel[a.position]}: ${a.name}`);
    }
  }
  lines.push("");

  lines.push("## Conditions");
  lines.push("");
  lines.push("### Preconditions");
  lines.push("");
  for (const p of conditions.preconditions) {
    lines.push(`- ${p}`);
  }
  lines.push("");
  lines.push("### Trigger");
  lines.push("");
  lines.push(conditions.trigger);
  lines.push("");

  lines.push("## Flow");
  lines.push("");
  lines.push("### Main Flow");
  lines.push("");
  flow.mainFlow.forEach((step, i) => {
    lines.push(`${i + 1}. ${step}`);
  });
  lines.push("");
  if (flow.alternativeFlow.length) {
    lines.push("### Alternative Flow");
    lines.push("");
    for (const f of flow.alternativeFlow) {
      lines.push(`#### ${f.code}`);
      lines.push("");
      f.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
      lines.push("");
    }
  }
  if (flow.exceptionFlow.length) {
    lines.push("### Exception Flow");
    lines.push("");
    for (const f of flow.exceptionFlow) {
      lines.push(`#### ${f.code}`);
      lines.push("");
      f.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
      lines.push("");
    }
  }

  lines.push(`## Acceptance Criteria`);
  lines.push("");
  for (const ac of acceptanceCriteria) {
    lines.push(`#### ${ac.code}`);
    lines.push("");
    for (const c of ac.criterias) {
      lines.push(`- **${CriteriaConditionLabel[c.type]}**: ${c.step}`);
    }
    lines.push("");
  }

  lines.push("## Activity Diagram");
  lines.push("");
  lines.push(data.activityDiagram);
  lines.push("");

  lines.push("## References");
  lines.push("");
  lines.push("### Business Rules");
  lines.push("");
  for (const r of data.references.businessRules) {
    lines.push(`- ${r}`);
  }
  lines.push("");
  lines.push("### Dependencies");
  lines.push("");
  for (const r of data.references.dependencies) {
    lines.push(`- ${r}`);
  }
  lines.push("");

  lines.push("## Non-Functional");
  lines.push("");
  for (const r of data.nonFunctional) {
    lines.push(`- ${r}`);
  }
  lines.push("");

  lines.push("## Out of Scope");
  lines.push("");
  for (const r of data.outOfScope) {
    lines.push(`- ${r}`);
  }
  lines.push("");

  return lines.join("\n");
}

// ── MD parsing helpers ────────────────────────────────────────────

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

function parseOrderedList(lines: string[]): string[] {
  return lines
    .map((l) => l.trim())
    .filter((l) => /^\d+\.\s/.test(l))
    .map((l) => l.replace(/^\d+\.\s+/, "").trim())
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

// ── Public API ────────────────────────────────────────────────────

export function fromMarkdown(md: string): Schema {
  // Strip any embedded HTML comments (backward-compat with old exports)
  let inComment = false;
  const lines = md.split("\n").filter((line) => {
    if (line.includes("<!--")) inComment = true;
    if (inComment) {
      if (line.includes("-->")) inComment = false;
      return false;
    }
    return true;
  });

  // ID from # heading
  const idLine = lines.find((l) => l.startsWith("# "));
  const id = idLine ? idLine.slice(2).trim() : "";

  const h2 = splitByHeading(lines, 2);

  // ── Metadata ──
  const metaLines = h2["Metadata"] ?? [];
  let story = "";
  let context = "";
  let sprint = 1;
  let priority: Schema["metadata"]["priority"] = "Must";
  let status: Schema["metadata"]["status"] = "Documentation";
  let creator = "";
  const assignee: Schema["metadata"]["assignee"] = [];

  const statusByLabel = invertRecord(StatusLabel);
  const positionByLabel = invertRecord(PositionLabel);
  let inAssignee = false;

  for (const line of metaLines) {
    const trimmed = line.trim();
    const kv = parseBoldKey(trimmed);
    if (kv) {
      inAssignee = false;
      switch (kv.key) {
        case "Story":
          story = kv.value;
          break;
        case "Context":
          context = kv.value;
          break;
        case "Sprint":
          sprint = parseInt(kv.value, 10) || 1;
          break;
        case "Priority":
          priority = kv.value as Schema["metadata"]["priority"];
          break;
        case "Status":
          status = (statusByLabel[kv.value as keyof typeof statusByLabel] ??
            kv.value) as Schema["metadata"]["status"];
          break;
        case "Creator":
          creator = kv.value;
          break;
        case "Assignee":
          inAssignee = true;
          break;
      }
    } else if (inAssignee && trimmed.startsWith("- ")) {
      const inner = trimmed.slice(2).trim();
      const col = inner.indexOf(":");
      if (col !== -1) {
        const posLabel = inner.slice(0, col).trim();
        const name = inner.slice(col + 1).trim();
        const position =
          positionByLabel[posLabel as keyof typeof positionByLabel] ?? posLabel;
        if (name) assignee.push({ name, position });
      }
    }
  }

  // ── Conditions ──
  const condH3 = splitByHeading(h2["Conditions"] ?? [], 3);
  const preconditions = parseBulletList(condH3["Preconditions"] ?? []);
  const trigger = (condH3["Trigger"] ?? [])
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ");

  // ── Flow ──
  const flowH3 = splitByHeading(h2["Flow"] ?? [], 3);
  const mainFlow = parseOrderedList(flowH3["Main Flow"] ?? []);

  const parseFlowGroup = (
    sectionLines: string[],
  ): { code: string; steps: string[] }[] =>
    Object.entries(splitByHeading(sectionLines, 4)).map(
      ([code, stepLines]) => ({
        code,
        steps: parseOrderedList(stepLines),
      }),
    );

  const alternativeFlow = parseFlowGroup(flowH3["Alternative Flow"] ?? []);
  const exceptionFlow = parseFlowGroup(flowH3["Exception Flow"] ?? []);

  // ── Acceptance Criteria ──
  const acLines = h2["Acceptance Criteria"] ?? [];
  const acceptanceCriteria = Object.entries(splitByHeading(acLines, 4)).map(
    ([code, groupLines]) => ({
      code,
      criterias: groupLines
        .map((l) => parseBoldKey(l.trim()))
        .filter((kv): kv is { key: string; value: string } => kv !== null)
        .filter((kv) => Object.keys(CriteriaCondition).includes(kv.key))
        .map((kv) => ({
          type: kv.key as Schema["acceptanceCriteria"][number]["criterias"][number]["type"],
          step: kv.value,
        })),
    }),
  );

  // ── Activity Diagram ──
  const activityDiagram =
    (h2["Activity Diagram"] ?? []).map((l) => l.trim()).find(Boolean) ?? "";

  // ── References ──
  const refH3 = splitByHeading(h2["References"] ?? [], 3);
  const businessRules = parseBulletList(refH3["Business Rules"] ?? []);
  const dependencies = parseBulletList(refH3["Dependencies"] ?? []);

  // ── Non-Functional & Out of Scope ──
  const nonFunctional = parseBulletList(h2["Non-Functional"] ?? []);
  const outOfScope = parseBulletList(h2["Out of Scope"] ?? []);

  const data = {
    metadata: {
      id,
      story,
      context,
      sprint,
      priority,
      assignee,
      creator,
      status,
    },
    conditions: { preconditions, trigger },
    flow: { mainFlow, alternativeFlow, exceptionFlow },
    acceptanceCriteria,
    activityDiagram,
    references: { businessRules, dependencies },
    nonFunctional,
    outOfScope,
  };

  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => {
      const label = pathToLabel(i.path as (string | number)[]);
      return `${label}: ${i.message}`;
    });
    const err = new Error("Dữ liệu không hợp lệ") as Error & { messages: string[] };
    err.messages = messages;
    throw err;
  }
  return result.data;
}

export function toSampleMarkdown(): string {
  const lines: string[] = [];

  lines.push("<!--");
  lines.push("  USER STORY TEMPLATE");
  lines.push("  ════════════════════════════════════════════════════════════");
  lines.push("  Fill in every field below, then import this file into the");
  lines.push('  VNZ Converter app using the "Nhập MD" button.');
  lines.push("");
  lines.push("  AI PROMPT (copy → paste into ChatGPT / Claude / Gemini):");
  lines.push("  ────────────────────────────────────────────────────────────");
  lines.push('  "Fill in the user story template below. Keep every heading,');
  lines.push("  bullet prefix (**Bold**:), and ordered-list number exactly");
  lines.push("  as-is. Only replace the placeholder text after each colon.");
  lines.push("  Do NOT add or remove sections. Do NOT change enum values —");
  lines.push('  use only the options listed in the comments."');
  lines.push("  ════════════════════════════════════════════════════════════");
  lines.push("-->");
  lines.push("");
  lines.push("# STORY-XXX");
  lines.push(
    "<!-- Replace STORY-XXX with the actual story ID, e.g. STORY-042 -->",
  );
  lines.push("");
  lines.push("## Metadata");
  lines.push("");
  lines.push(
    '<!-- Story: one-liner in the form "As a [role], I want [action] so that [benefit]" -->',
  );
  lines.push("- **Story**: ");
  lines.push("<!-- Context: background or motivation behind this story -->");
  lines.push("- **Context**: ");
  lines.push("<!-- Sprint: positive integer -->");
  lines.push("- **Sprint**: 1");
  lines.push("<!-- Priority: Must | Should | Could -->");
  lines.push("- **Priority**: Must");
  lines.push("<!-- Status: Documentation | Pending | InProgress | Done -->");
  lines.push("- **Status**: Documentation");
  lines.push("- **Creator**: ");
  lines.push(
    "<!-- Assignee: list members with their role. Valid roles: Frontend | Backend -->",
  );
  lines.push("- **Assignee**:");
  lines.push("  - Frontend: ");
  lines.push("  - Backend: ");
  lines.push("");
  lines.push("## Conditions");
  lines.push("");
  lines.push("### Preconditions");
  lines.push(
    "<!-- One bullet per precondition that must be true before the story can begin -->",
  );
  lines.push("");
  lines.push("- ");
  lines.push("");
  lines.push("### Trigger");
  lines.push(
    "<!-- Single sentence describing the event that starts this flow -->",
  );
  lines.push("");
  lines.push("");
  lines.push("## Flow");
  lines.push("");
  lines.push("### Main Flow");
  lines.push("<!-- Numbered steps of the happy path -->");
  lines.push("");
  lines.push("1. ");
  lines.push("");
  lines.push("### Alternative Flow");
  lines.push(
    "<!-- Optional. Each sub-flow starts with #### CODE, then numbered steps.",
  );
  lines.push(
    "     Remove this section entirely if there are no alternative flows. -->",
  );
  lines.push("");
  lines.push("#### ALT-01");
  lines.push("");
  lines.push("1. ");
  lines.push("");
  lines.push("### Exception Flow");
  lines.push("<!-- Optional. Same structure as Alternative Flow above. -->");
  lines.push("");
  lines.push("#### EXC-01");
  lines.push("");
  lines.push("1. ");
  lines.push("");
  lines.push("## Acceptance Criteria");
  lines.push("");
  lines.push(
    "<!-- Each block starts with #### CODE. BDD keywords: Given | When | Then | And -->",
  );
  lines.push("#### AC-XXX");
  lines.push("");
  lines.push("- **Given**: ");
  lines.push("- **When**: ");
  lines.push("- **Then**: ");
  lines.push("");
  lines.push("## Activity Diagram");
  lines.push(
    "<!-- A single URL pointing to the activity diagram (required, must start with https://) -->",
  );
  lines.push("");
  lines.push("https://example.com/diagram");
  lines.push("");
  lines.push("## References");
  lines.push("");
  lines.push("### Business Rules");
  lines.push(
    '<!-- One bullet per business rule, e.g. "BR-01: Password must be at least 8 chars" -->',
  );
  lines.push("");
  lines.push("- ");
  lines.push("");
  lines.push("### Dependencies");
  lines.push(
    '<!-- One bullet per dependency on another story or system, e.g. "STORY-010: Email service" -->',
  );
  lines.push("");
  lines.push("- ");
  lines.push("");
  lines.push("## Non-Functional");
  lines.push(
    "<!-- One bullet per non-functional requirement (performance, security, accessibility, …) -->",
  );
  lines.push("");
  lines.push("- ");
  lines.push("");
  lines.push("## Out of Scope");
  lines.push(
    "<!-- One bullet per item explicitly excluded from this story -->",
  );
  lines.push("");
  lines.push("- ");
  lines.push("");
  return lines.join("\n");
}

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const COLS = 7;

type Cell = {
  content: string;
  cls: string;
  colspan?: number;
  rowspan?: number;
};

const row = (cells: Cell[]): string => {
  const tds = cells
    .map((c) => {
      const attrs: string[] = [`class="${c.cls}"`, `dir="ltr"`];
      if (c.colspan && c.colspan > 1) attrs.push(`colspan="${c.colspan}"`);
      if (c.rowspan && c.rowspan > 1) attrs.push(`rowspan="${c.rowspan}"`);
      return `<td ${attrs.join(" ")}>${c.content}</td>`;
    })
    .join("");
  return `<tr>${tds}</tr>`;
};

const separatorRow = (cls: string): string =>
  row([{ content: "", cls, colspan: COLS }]);

const STYLE = `
.ritz { font-family: Arial, sans-serif; color: #000; }
.waffle { border-collapse: collapse; table-layout: fixed; width: 1240px; }
.waffle td { padding: 4px 6px; border: 1px solid #000; font-size: 10pt; vertical-align: middle; word-wrap: break-word; }
.waffle a { color: inherit; }
.grid-container { padding: 12px; display: flex; justify-content: center; }
.waffle .s0 { background:#d0e0e3; text-align:center; }
.waffle .s1 { background:#fff2cc; text-align:center; }
.waffle .s2 { background:#ffffff; text-align:left; }
.waffle .s3 { background:#ffffff; text-align:left; white-space: normal; }
.waffle .s4 { background:#ffffff; text-align:center; }
.waffle .s5 { background:#d9d9d9; text-align:center; }
.waffle .s6 { background:#d9ead3; text-align:center; }
.waffle .s10 { background:#cfe2f3; text-align:center; }
.waffle .s11 { background:#ffffff; text-align:center; white-space: normal; }
.waffle .s13 { background:#d9d2e9; text-align:center; white-space: normal; }
.waffle .s14 { background:#cccccc; text-align:center; }
.waffle .s15 { background:#ead1dc; text-align:center; }
.waffle .s16 { background:#ffffff; text-align:left; color:#1155cc; text-decoration:underline; }
.waffle .s17 { background:#f4cccc; text-align:center; white-space: normal; }
.waffle .s18 { background:#fce5cd; text-align:center; }
`.trim();

export function toHtml(data: Schema): string {
  const rows: string[] = [];

  rows.push(
    row([
      {
        content: escapeHtml(data.metadata.id || "User Story"),
        cls: "s0",
        colspan: COLS,
      },
    ]),
  );

  // ---- METADATA ----
  const meta = data.metadata;
  const assignees = meta.assignee.length
    ? meta.assignee
    : [{ name: "", position: "FE" as const }];
  const metadataRowCount = 6 + assignees.length;

  rows.push(
    row([
      { content: "METADATA", cls: "s1", rowspan: metadataRowCount },
      { content: "Story", cls: "s2", colspan: 2 },
      { content: escapeHtml(meta.story), cls: "s3", colspan: 4 },
    ]),
  );
  rows.push(
    row([
      { content: "Context", cls: "s2", colspan: 2 },
      { content: escapeHtml(meta.context), cls: "s3", colspan: 4 },
    ]),
  );
  rows.push(
    row([
      { content: "Sprint", cls: "s2", colspan: 2 },
      { content: `S${meta.sprint}`, cls: "s2", colspan: 4 },
    ]),
  );
  rows.push(
    row([
      { content: "Priority", cls: "s2", colspan: 2 },
      { content: meta.priority, cls: "s2", colspan: 4 },
    ]),
  );
  assignees.forEach((a, i) => {
    if (i === 0) {
      rows.push(
        row([
          { content: "Assignee", cls: "s2", rowspan: assignees.length },
          { content: a.position, cls: "s4" },
          { content: escapeHtml(a.name), cls: "s2", colspan: 4 },
        ]),
      );
    } else {
      rows.push(
        row([
          { content: a.position, cls: "s4" },
          { content: escapeHtml(a.name), cls: "s2", colspan: 4 },
        ]),
      );
    }
  });
  rows.push(
    row([
      { content: "Creator", cls: "s2", colspan: 2 },
      { content: escapeHtml(meta.creator), cls: "s2", colspan: 4 },
    ]),
  );
  rows.push(
    row([
      { content: "Status", cls: "s2", colspan: 2 },
      { content: meta.status, cls: "s2", colspan: 4 },
    ]),
  );
  rows.push(separatorRow("s5"));

  // ---- CONDITIONS ----
  const preconditions = data.conditions.preconditions.length
    ? data.conditions.preconditions
    : [""];
  const conditionsRowCount = preconditions.length + 1;
  preconditions.forEach((p, i) => {
    if (i === 0) {
      rows.push(
        row([
          { content: "CONDITIONS", cls: "s6", rowspan: conditionsRowCount },
          {
            content: "Preconditions",
            cls: "s2",
            colspan: 2,
            rowspan: preconditions.length,
          },
          { content: escapeHtml(p), cls: "s2", colspan: 4 },
        ]),
      );
    } else {
      rows.push(row([{ content: escapeHtml(p), cls: "s2", colspan: 4 }]));
    }
  });
  rows.push(
    row([
      { content: "Trigger", cls: "s2", colspan: 2 },
      { content: escapeHtml(data.conditions.trigger), cls: "s2", colspan: 4 },
    ]),
  );
  rows.push(separatorRow("s5"));

  // ---- FLOW ----
  const mainFlow = data.flow.mainFlow;
  const altFlow = data.flow.alternativeFlow;
  const excFlow = data.flow.exceptionFlow;
  const altRowCount = altFlow.reduce((n, f) => n + f.steps.length, 0);
  const excRowCount = excFlow.reduce((n, f) => n + f.steps.length, 0);
  const flowRowCount = mainFlow.length + altRowCount + excRowCount;

  mainFlow.forEach((step, i) => {
    const cells: Cell[] = [];
    if (i === 0) {
      cells.push({ content: "FLOW", cls: "s10", rowspan: flowRowCount });
      cells.push({
        content: "Main Flow",
        cls: "s4",
        colspan: 2,
        rowspan: mainFlow.length,
      });
    }
    cells.push({
      content: `${i + 1}. ${escapeHtml(step)}`,
      cls: "s2",
      colspan: 4,
    });
    rows.push(row(cells));
  });

  let altStepIdx = 0;
  altFlow.forEach((f) => {
    f.steps.forEach((step, si) => {
      const cells: Cell[] = [];
      if (altStepIdx === 0) {
        cells.push({
          content: "Alternative Flow",
          cls: "s11",
          colspan: 1,
          rowspan: altRowCount,
        });
      }
      if (si === 0) {
        cells.push({
          content: escapeHtml(f.code),
          cls: "s4",
          rowspan: f.steps.length,
        });
      }
      cells.push({ content: escapeHtml(step), cls: "s2", colspan: 4 });
      rows.push(row(cells));
      altStepIdx++;
    });
  });

  let excStepIdx = 0;
  excFlow.forEach((f) => {
    f.steps.forEach((step, si) => {
      const cells: Cell[] = [];
      if (excStepIdx === 0) {
        cells.push({
          content: "Exception Flow",
          cls: "s11",
          colspan: 1,
          rowspan: excRowCount,
        });
      }
      if (si === 0) {
        cells.push({
          content: escapeHtml(f.code),
          cls: "s4",
          rowspan: f.steps.length,
        });
      }
      cells.push({ content: escapeHtml(step), cls: "s2", colspan: 4 });
      rows.push(row(cells));
      excStepIdx++;
    });
  });
  rows.push(separatorRow("s5"));

  // ---- ACCEPTANCE CRITERIA ----
  const acGroups = data.acceptanceCriteria.filter((ac) => ac.criterias.length > 0);
  if (acGroups.length) {
    const totalAcRows = acGroups.reduce((n, ac) => n + ac.criterias.length, 0);
    let firstAcRow = true;
    acGroups.forEach((ac) => {
      ac.criterias.forEach((c, ci) => {
        const cells: Cell[] = [];
        if (firstAcRow) {
          cells.push({ content: "ACCEPTANCE CRITERIA", cls: "s13", rowspan: totalAcRows });
          firstAcRow = false;
        }
        if (ci === 0) {
          cells.push({ content: escapeHtml(ac.code || "AC"), cls: "s4", rowspan: ac.criterias.length });
        }
        cells.push({ content: c.type, cls: "s2" });
        cells.push({ content: escapeHtml(c.step), cls: "s2", colspan: 4 });
        rows.push(row(cells));
      });
    });
    rows.push(separatorRow("s14"));
  }

  // ---- REFERENCES ----
  const brs = data.references.businessRules;
  const deps = data.references.dependencies;
  if (brs.length || deps.length) {
    const refRowCount = Math.max(brs.length, 1) + Math.max(deps.length, 1);
    let refFirst = true;
    if (brs.length) {
      brs.forEach((r, i) => {
        const cells: Cell[] = [];
        if (refFirst) {
          cells.push({
            content: "REFERENCES",
            cls: "s15",
            rowspan: refRowCount,
          });
          refFirst = false;
        }
        if (i === 0) {
          cells.push({
            content: "Business Rules",
            cls: "s2",
            colspan: 2,
            rowspan: brs.length,
          });
        }
        cells.push({ content: escapeHtml(r), cls: "s16", colspan: 4 });
        rows.push(row(cells));
      });
    }
    if (deps.length) {
      deps.forEach((r, i) => {
        const cells: Cell[] = [];
        if (refFirst) {
          cells.push({
            content: "REFERENCES",
            cls: "s15",
            rowspan: refRowCount,
          });
          refFirst = false;
        }
        if (i === 0) {
          cells.push({
            content: "Dependencies",
            cls: "s2",
            colspan: 2,
            rowspan: deps.length,
          });
        }
        cells.push({ content: escapeHtml(r), cls: "s16", colspan: 4 });
        rows.push(row(cells));
      });
    }
    rows.push(separatorRow("s14"));
  }

  // ---- NON-FUNCTIONAL ----
  if (data.nonFunctional.length) {
    data.nonFunctional.forEach((r, i) => {
      const cells: Cell[] = [];
      if (i === 0) {
        cells.push({
          content: "NON-FUNCTIONAL",
          cls: "s17",
          rowspan: data.nonFunctional.length,
        });
      }
      cells.push({ content: escapeHtml(r), cls: "s2", colspan: 6 });
      rows.push(row(cells));
    });
    rows.push(separatorRow("s14"));
  }

  // ---- OUT OF SCOPE ----
  if (data.outOfScope.length) {
    data.outOfScope.forEach((r, i) => {
      const cells: Cell[] = [];
      if (i === 0) {
        cells.push({
          content: "OUT OF SCOPE",
          cls: "s18",
          rowspan: data.outOfScope.length,
        });
      }
      cells.push({ content: escapeHtml(r), cls: "s2", colspan: 6 });
      rows.push(row(cells));
    });
  }

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>${escapeHtml(data.metadata.id || "User Story")}</title>
<style>${STYLE}</style>
</head>
<body>
<div class="ritz grid-container" dir="ltr">
<table class="waffle" cellspacing="0" cellpadding="0">
<tbody>
${rows.join("\n")}
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
