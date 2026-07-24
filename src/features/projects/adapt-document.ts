import { toRuleHtml } from "@/features/business-rules/exporters";
import type { RuleSchema } from "@/features/business-rules/validations";
import { toTddHtml } from "@/features/tdds/exporters";
import type { TddSchema } from "@/features/tdds/validations";
import { toHtml as usToHtml } from "@/features/user-stories/exporters";
import type { Schema as UsSchema } from "@/features/user-stories/validations";
import { DocumentType, StoryPriorityLabel } from "./document-types";
import type { DocumentDetail } from "./document-types";

// Map tài liệu structured từ backend sang Schema của user-stories rồi render bằng CHÍNH
// exporter cũ (toHtml). Nhờ vậy trang xem tài liệu dùng lại đúng bộ render "waffle" như
// trang GitHub, thay vì hiển thị Markdown thô. Không validate (toHtml không cần) nên tài
// liệu draft/thiếu field vẫn render được.

const FLOW = { Main: 1, Alternative: 2, Exception: 3 } as const;
const LIST = { Precondition: 1, NonFunctional: 2, OutOfScope: 3 } as const;
const REF = { UserStory: 1, Tdd: 2, BusinessRule: 3 } as const;

export function adaptUserStory(doc: DocumentDetail): UsSchema {
  const c = doc.content;

  const itemsOf = (type: number) =>
    c.listItems.filter((i) => i.itemType === type).map((i) => i.content);

  const flowsOf = (type: number) =>
    c.flows
      .filter((f) => f.flowType === type)
      .map((f) => ({ code: f.code || f.title || "", steps: f.steps }));

  const mainFlow = c.flows.find((f) => f.flowType === FLOW.Main)?.steps ?? [];

  const linksOf = (kind: number) =>
    c.links
      .filter((l) => l.targetKind === kind)
      .map((l) => ({ id: l.targetDocKey, path: l.targetDocKey }));

  // Activity diagram (US chỉ có 1 URL): lấy externalUrl của diagram Activity, hoặc diagram
  // đầu tiên có externalUrl.
  const activityDiagram =
    c.diagrams.find((d) => d.diagramType === 1 && d.externalUrl)?.externalUrl ??
    c.diagrams.find((d) => d.externalUrl)?.externalUrl ??
    "";

  return {
    metadata: {
      id: doc.docKey,
      story: c.storyStatement ?? "",
      context: c.context ?? "",
      sprint: c.sprint ?? 1,
      priority: (c.priority != null
        ? StoryPriorityLabel[c.priority]
        : "Must") as UsSchema["metadata"]["priority"],
      assignee: c.assignees.map((a) => ({
        name: a.displayName,
        position: (a.role === 2 ? "BE" : "FE") as "FE" | "BE",
      })),
      creator: c.ownerName ?? "",
      status: "InProgress" as UsSchema["metadata"]["status"],
    },
    conditions: {
      preconditions: itemsOf(LIST.Precondition),
      trigger: c.trigger ?? "",
    },
    flow: {
      mainFlow,
      alternativeFlow: flowsOf(FLOW.Alternative),
      exceptionFlow: flowsOf(FLOW.Exception),
    },
    acceptanceCriteria: c.acceptanceCriteria.map((cr) => ({
      code: cr.code,
      criterias: [
        { type: "Given" as const, step: cr.givenText },
        { type: "When" as const, step: cr.whenText },
        { type: "Then" as const, step: cr.thenText },
        ...cr.andConditions.map((a) => ({ type: "And" as const, step: a })),
      ],
    })),
    activityDiagram,
    references: {
      tdds: linksOf(REF.Tdd),
      rules: linksOf(REF.BusinessRule),
      dependencies: linksOf(REF.UserStory),
    },
    nonFunctional: itemsOf(LIST.NonFunctional),
    outOfScope: itemsOf(LIST.OutOfScope),
  };
}

// ── Rule: backend content → RuleSchema (dùng cho BusinessRuleRow của view.page) ──────
const RULE_STATUS: Record<number, RuleSchema["status"]> = {
  30: "Draft",
  31: "Active",
  32: "Deprecated",
};

export function adaptRule(doc: DocumentDetail): RuleSchema {
  const c = doc.content;
  return {
    ruleId: doc.docKey,
    name: c.ruleName ?? c.title ?? "",
    category: c.category ?? "",
    statement: c.statement ?? "",
    when: c.whenCondition ?? "",
    then: c.thenAction ?? "",
    except: c.exceptCondition ?? "",
    source: c.source ?? "",
    owner: c.ruleOwnerName ?? "",
    relatedStories: c.links
      .filter((l) => l.targetKind === REF.UserStory)
      .map((l) => l.targetDocKey),
    status: RULE_STATUS[doc.status] ?? "Draft",
    version: c.versionLabel ?? `v${doc.currentVersionNumber}`,
    effectiveDate: c.effectiveDate ?? "",
    notes: c.ruleNotes ?? "",
  };
}

// ── TDD: backend content → TddSchema (dùng cho TddDocumentView của view.page) ─────────
const TDD_STATUS: Record<number, TddSchema["documentInfo"]["status"]> = {
  20: "Draft",
  21: "InReview",
  22: "Approved",
  23: "Approved", // Deprecated: không có ở frontend, xấp xỉ Approved
};
const HTTP: Record<number, TddSchema["internalApi"]["endpoints"][number]["method"]> =
  { 1: "GET", 2: "POST", 3: "PUT", 4: "PATCH", 5: "DELETE", 6: "GET", 7: "GET" };
const DIAG = { Activity: 1, Sequence: 2, State: 3, Architecture: 4, DataModel: 5 };
const TLIST = {
  Goal: 10,
  NonGoal: 11,
  Quirk: 12,
  ArchNote: 13,
  DataNote: 14,
  ExtRef: 15,
  ApiField: 16,
};

export function adaptTdd(doc: DocumentDetail): TddSchema {
  const c = doc.content;
  const items = (t: number) =>
    c.listItems.filter((i) => i.itemType === t).map((i) => i.content);
  const linksK = (k: number) =>
    c.links.filter((l) => l.targetKind === k).map((l) => l.targetDocKey);
  const diag = (t: number) => {
    const d = c.diagrams.find((x) => x.diagramType === t);
    return {
      description: d?.description ?? "",
      mermaid: d?.sourceCode ?? d?.externalUrl ?? "",
      notes: [] as string[],
    };
  };
  const internalEps = c.endpoints.filter((e) => e.scope === 1);
  const externalEps = c.endpoints.filter((e) => e.scope === 2);
  const dateOnly = (s: string | null | undefined) =>
    (s ?? doc.createdAt).slice(0, 10);

  return {
    documentInfo: {
      docId: doc.docKey,
      feature: c.featureName ?? c.title ?? "",
      author: c.ownerName ?? "",
      reviewer: c.reviewerName ?? "",
      status: TDD_STATUS[doc.status] ?? "Draft",
      version: c.versionLabel ?? `v${doc.currentVersionNumber}`,
      updatedAt: dateOnly(c.updatedAt ?? doc.updatedAt),
      relatedStories: linksK(REF.UserStory),
      businessRules: linksK(REF.BusinessRule),
    },
    contextGoals: {
      problem: c.problem ?? "",
      goals: items(TLIST.Goal),
      nonGoals: items(TLIST.NonGoal),
    },
    architecture: { ...diag(DIAG.Architecture), notes: items(TLIST.ArchNote) },
    sequenceDiagram: diag(DIAG.Sequence),
    activityDiagram: diag(DIAG.Activity),
    stateDiagram: diag(DIAG.State),
    dataModel: { ...diag(DIAG.DataModel), notes: items(TLIST.DataNote) },
    internalApi: {
      endpoints: internalEps.map((e) => ({
        endpoint: e.path ?? e.name ?? "",
        method: HTTP[e.method ?? 1] ?? "GET",
        description: e.description ?? "",
      })),
      examples: internalEps.flatMap((e) => e.examples).map((ex) => ({
        title: ex.title ?? "",
        content: ex.responseSample ?? ex.requestSample ?? ex.errorSample ?? "",
      })),
      errorCodes: c.errorCodes.map((ec) => ({
        code: ec.code,
        http: ec.httpStatus?.toString() ?? "",
        when: ec.description ?? "",
      })),
    },
    externalApi: {
      endpoints: externalEps.map((e) => ({
        endpoint: e.path ?? e.name ?? "",
        purpose: e.description ?? "",
        note: "",
      })),
      fields: c.listItems
        .filter((i) => i.itemType === TLIST.ApiField)
        .map((i) => ({ field: i.label ?? "", meaning: i.content, note: "" })),
      errorHandling: c.externalErrorHandling ?? "",
      quirks: items(TLIST.Quirk),
    },
    references: {
      userStories: linksK(REF.UserStory),
      businessRules: linksK(REF.BusinessRule),
      useCases: linksK(4),
      others: items(TLIST.ExtRef),
    },
    changeLog: c.changeLog.map((cl) => ({
      date: dateOnly(cl.createdAt),
      version: cl.versionLabel,
      change: cl.change ?? "",
      author: cl.author ?? "",
    })),
  };
}

// Render tài liệu backend bằng CHÍNH bộ render "waffle" cũ mà view.page.tsx (GitHub) dùng —
// chỉ khác nguồn dữ liệu đầu vào: schema đến từ adapt*(doc) thay vì from*Markdown(md).
export function renderBackendDocHtml(doc: DocumentDetail): string | null {
  try {
    if (doc.docType === DocumentType.UserStory) {
      return usToHtml(adaptUserStory(doc));
    }
    if (doc.docType === DocumentType.Tdd) {
      return toTddHtml(adaptTdd(doc));
    }
    if (doc.docType === DocumentType.BusinessRule) {
      return toRuleHtml(adaptRule(doc));
    }
    return null;
  } catch {
    return null;
  }
}
