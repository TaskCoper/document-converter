import type { RuleSchema } from "@/features/business-rules/validations";
import type { TddSchema } from "@/features/tdds/validations";
import {
  toHtml as usToHtml,
  type HtmlInput as UsHtmlInput,
} from "@/features/user-stories/exporters";
import type { Schema as UsSchema } from "@/features/user-stories/validations";
import type { DefaultValues } from "react-hook-form";
import {
  AssigneeRoleLabel,
  AssigneeRoleToPosition,
  DiagramFormat,
  DiagramFormatLabel,
  DocumentStatusLabel,
  DocumentType,
  StoryPriorityLabel,
} from "./document-types";
import type { DocumentDetail } from "./document-types";

// Map tài liệu structured từ backend sang Schema của user-stories rồi render bằng CHÍNH
// exporter cũ (toHtml). Nhờ vậy trang xem tài liệu dùng lại đúng bộ render "waffle" như
// trang GitHub, thay vì hiển thị Markdown thô. Không validate (toHtml không cần) nên tài
// liệu draft/thiếu field vẫn render được.

const FLOW = { Main: 1, Alternative: 2, Exception: 3 } as const;
const LIST = {
  Precondition: 1,
  NonFunctional: 2,
  OutOfScope: 3,
  Assumption: 90,
  OpenQuestion: 91,
} as const;
const REF = { UserStory: 1, Tdd: 2, BusinessRule: 3 } as const;

// Phần KHÔNG khác nhau giữa đường hiển thị và đường form: các section thuần văn bản, chép
// nguyên xi từ backend nên không có gì để nắn.
function storyBody(doc: DocumentDetail) {
  const c = doc.content;

  const itemsOf = (type: number) =>
    c.listItems.filter((i) => i.itemType === type).map((i) => i.content);

  const flowsOf = (type: number) =>
    c.flows
      .filter((f) => f.flowType === type)
      .map((f) => ({
        code: f.code ?? "",
        title: f.title ?? "",
        steps: f.steps,
      }));

  const linksOf = (kind: number) =>
    c.links
      .filter((l) => l.targetKind === kind)
      .map((l) => ({
        id: l.targetDocKey,
        path: l.targetDocKey,
        linkType: l.linkType,
        note: l.note ?? "",
      }));

  const mainFlow = c.flows.find((f) => f.flowType === FLOW.Main);

  // Không đọc c.diagrams: sơ đồ chỉ thuộc TDD, và backend cũng đã từ chối gắn chúng vào
  // User Story (DocumentValidator.EnsureDiagramsAllowed).

  return {
    conditions: {
      preconditions: itemsOf(LIST.Precondition),
      trigger: c.trigger ?? "",
    },
    flow: {
      mainFlow: mainFlow?.steps ?? [],
      mainFlowTitle: mainFlow?.title ?? "",
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
    references: {
      tdds: linksOf(REF.Tdd),
      rules: linksOf(REF.BusinessRule),
      dependencies: linksOf(REF.UserStory),
    },
    nonFunctional: itemsOf(LIST.NonFunctional),
    outOfScope: itemsOf(LIST.OutOfScope),
    assumptions: itemsOf(LIST.Assumption),
    openQuestions: itemsOf(LIST.OpenQuestion),
  };
}

// ── Đường HIỂN THỊ ───────────────────────────────────────────────────────────────────
// Trung thực với response: không bịa mặc định, không nắn về enum của form. Dùng nhãn tiếng
// Việt cho status để khớp badge ở header trang chi tiết — hai chỗ trên cùng màn hình mà nói
// khác nhau thì người đọc không biết tin cái nào.
export function adaptUserStoryView(doc: DocumentDetail): UsHtmlInput {
  const c = doc.content;
  const body = storyBody(doc);
  // Bảng waffle chỉ có một cột hẹp cho luồng phụ: ưu tiên mã, luồng không có mã thì lấy tiêu
  // đề để ô không trống trơn.
  const codeOrTitle = (fs: { code: string; title?: string; steps: string[] }[]) =>
    fs.map((f) => ({ ...f, code: f.code || f.title || "" }));
  return {
    metadata: {
      id: doc.docKey,
      story: c.storyStatement ?? "",
      context: c.context ?? "",
      sprint: c.sprint ?? null,
      priority: c.priority != null ? StoryPriorityLabel[c.priority] : "",
      assignee: c.assignees.map((a) => ({
        name: a.displayName,
        position: AssigneeRoleLabel[a.role] ?? String(a.role),
      })),
      creator: c.ownerName ?? "",
      status: DocumentStatusLabel[doc.status] ?? String(doc.status),
    },
    ...body,
    flow: {
      ...body.flow,
      alternativeFlow: codeOrTitle(body.flow.alternativeFlow),
      exceptionFlow: codeOrTitle(body.flow.exceptionFlow),
    },
  };
}

// ── Đường FORM ───────────────────────────────────────────────────────────────────────
// Trả về DefaultValues chứ không phải UsSchema: story chưa gán sprint/priority phải để TRỐNG
// cho zod bắt người dùng nhập, chứ không mặc định "S1"/"Must" — mặc định đó sẽ được ghi thẳng
// xuống DB ở lần lưu kế tiếp, biến giá trị bịa thành dữ liệu thật.
//
// `position` vẫn phải rút về FE/BE vì ô chọn trong form chỉ có hai lựa chọn đó. Vai trò gốc
// (QA, DevOps...) KHÔNG bị mất khi lưu — saveUserStory giữ lại, xem chú thích ở đó.
export function adaptUserStoryForm(
  doc: DocumentDetail,
): DefaultValues<UsSchema> {
  const c = doc.content;
  const priority = c.priority != null ? StoryPriorityLabel[c.priority] : null;
  return {
    metadata: {
      id: doc.docKey,
      story: c.storyStatement ?? "",
      context: c.context ?? "",
      sprint: c.sprint ?? undefined,
      priority: (priority as UsSchema["metadata"]["priority"]) ?? undefined,
      assignee: c.assignees.map((a) => ({
        name: a.displayName,
        position: (AssigneeRoleToPosition[a.role] ??
          "Other") as UsSchema["metadata"]["assignee"][number]["position"],
        userId: a.userId,
      })),
      creator: c.ownerName ?? "",
      // Không thuộc form: trang sửa có ô chọn trạng thái riêng (useState theo doc.status) và
      // chính ô đó mới được gửi đi. Điền vào đây chỉ để zod không kêu thiếu field.
      status: "InProgress" as UsSchema["metadata"]["status"],
    },
    ...storyBody(doc),
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
// ApiHttpMethod của backend: Get=1, Post=2, Put=3, Patch=4, Delete=5, Head=6, Options=7.
// Nắn 6/7 về GET là hiển thị sai động từ, không phải "xấp xỉ cho gần".
const HTTP: Record<number, TddSchema["internalApi"]["endpoints"][number]["method"]> = {
  1: "GET",
  2: "POST",
  3: "PUT",
  4: "PATCH",
  5: "DELETE",
  6: "HEAD",
  7: "OPTIONS",
};
const DIAG = { Activity: 1, Sequence: 2, State: 3, Architecture: 4, DataModel: 5 };
const TLIST = {
  Goal: 10,
  NonGoal: 11,
  Quirk: 12,
  ArchNote: 13,
  DataNote: 14,
  ExtRef: 15,
  ApiField: 16,
  Assumption: 90,
  OpenQuestion: 91,
};

const withNotes = <T extends { notes: string[] }>(d: T, extra: string[]) => ({
  ...d,
  notes: [...d.notes, ...extra],
});

export function adaptTdd(doc: DocumentDetail): TddSchema {
  const c = doc.content;
  const items = (t: number) =>
    c.listItems.filter((i) => i.itemType === t).map((i) => i.content);
  const linksK = (k: number) =>
    c.links.filter((l) => l.targetKind === k).map((l) => l.targetDocKey);
  // TddSchema chỉ có một ô `mermaid` và nó được đưa THẲNG vào bộ render Mermaid, nên chỉ
  // sơ đồ định dạng Mermaid mới được đi vào đó. Trước đây dùng `sourceCode ?? externalUrl`,
  // bất kể format: một sơ đồ PlantUML (@startuml) hay một URL cũng bị nạp vào Mermaid và nó
  // vẽ ra tấm "Syntax error in text" ở cuối trang.
  //
  // Nội dung không phải Mermaid thì đẩy xuống `notes` — nhìn thấy được, thay vì mất hẳn.
  const diag = (t: number) => {
    const d = c.diagrams.find((x) => x.diagramType === t);
    const isMermaid = d?.format === DiagramFormat.Mermaid;
    const notes: string[] = [];
    if (d && !isMermaid) {
      if (d.externalUrl) notes.push(d.externalUrl);
      else if (d.sourceCode)
        notes.push(
          `${DiagramFormatLabel[d.format] ?? `Định dạng ${d.format}`}:\n${d.sourceCode}`,
        );
    }
    return {
      description: d?.description ?? "",
      mermaid: isMermaid ? (d?.sourceCode ?? "") : "",
      notes,
      title: d?.title ?? "",
      format: d?.format,
      sourceCode: d?.sourceCode ?? "",
      externalUrl: d?.externalUrl ?? "",
    };
  };
  const internalEps = c.endpoints.filter((e) => e.scope === 1);
  const externalEps = c.endpoints.filter((e) => e.scope === 2);
  const dateOnly = (s: string | null | undefined) =>
    (s ?? doc.createdAt).slice(0, 10);

  // Giữ nguyên ba mẫu tách rời và gắn ví dụ vào ĐÚNG endpoint của nó. Gộp thành một chuỗi
  // rồi đổ chung một rổ là mất cả hai thứ: không biết ví dụ thuộc endpoint nào, và request
  // hay error của cùng một ví dụ bị nuốt mất.
  const examplesOf = (e: (typeof c.endpoints)[number]) =>
    e.examples.map((ex) => ({
      title: ex.title ?? "",
      requestSample: ex.requestSample ?? "",
      responseSample: ex.responseSample ?? "",
      responseStatus: ex.responseStatus,
      errorSample: ex.errorSample ?? "",
    }));

  // Mục "Others" lưu dạng "nhãn: nội dung" (xem MarkdownParser.AddColonItems). Bỏ nhãn đi
  // thì "Hợp đồng API đối tác" biến mất, chỉ còn URL trần.
  const labelled = (t: number) =>
    c.listItems
      .filter((i) => i.itemType === t)
      .map((i) => (i.label ? `${i.label}: ${i.content}` : i.content));

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
    // Gộp chứ không ghi đè notes: diag() có thể đã bỏ vào đó nội dung sơ đồ không phải
    // Mermaid, thay bằng list item là mất luôn.
    architecture: withNotes(diag(DIAG.Architecture), items(TLIST.ArchNote)),
    sequenceDiagram: diag(DIAG.Sequence),
    activityDiagram: diag(DIAG.Activity),
    stateDiagram: diag(DIAG.State),
    dataModel: withNotes(diag(DIAG.DataModel), items(TLIST.DataNote)),
    internalApi: {
      endpoints: internalEps.map((e) => ({
        endpoint: e.path ?? e.name ?? "",
        method: HTTP[e.method ?? 1] ?? "GET",
        description: e.description ?? "",
        name: e.name ?? "",
        examples: examplesOf(e),
      })),
      // Rỗng có chủ ý: ví dụ đã gắn vào từng endpoint ở trên. Danh sách phẳng này là đường
      // của nhánh GitHub (Markdown không gắn ví dụ với endpoint), điền cả hai sẽ hiện hai lần.
      examples: [],
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
        name: e.name ?? "",
        method: HTTP[e.method ?? 1],
        examples: examplesOf(e),
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
      others: labelled(TLIST.ExtRef),
    },
    changeLog: c.changeLog.map((cl) => ({
      date: dateOnly(cl.createdAt),
      version: cl.versionLabel,
      change: cl.change ?? "",
      author: cl.author ?? "",
    })),
    // Sơ đồ ngoài 5 ô cố định (Flowchart, Other…) — trước đây không hiện ở đâu cả.
    extraDiagrams: c.diagrams
      .filter((d) => !Object.values(DIAG).includes(d.diagramType))
      .map((d) => ({
        diagramType: d.diagramType,
        format: d.format,
        title: d.title ?? "",
        description: d.description ?? "",
        sourceCode: d.sourceCode ?? "",
        externalUrl: d.externalUrl ?? "",
      })),
    assumptions: items(TLIST.Assumption),
    openQuestions: items(TLIST.OpenQuestion),
    // Nhãn tra theo NỘI DUNG, không theo vị trí — khớp cách saveTdd giữ nhãn lúc lưu.
    goalLabels: c.listItems
      .filter((i) => i.itemType === TLIST.Goal)
      .map((i) => ({ label: i.label, content: i.content })),
    nonGoalLabels: c.listItems
      .filter((i) => i.itemType === TLIST.NonGoal)
      .map((i) => ({ label: i.label, content: i.content })),
    // Mọi cạnh, kể cả TDD→TDD (kind 2) vốn không có picker riêng ở form.
    linkMeta: c.links.map((l) => ({
      targetKind: l.targetKind,
      targetDocKey: l.targetDocKey,
      linkType: l.linkType,
      note: l.note ?? "",
    })),
  };
}

// Toàn bộ nội dung trang chi tiết dựng từ MỘT response GET /documents/{id}, không cần
// Markdown: TDD/Rule map sang schema rồi render bằng component React, User Story dùng lại
// bộ render "waffle" (toHtml) như view.page.tsx của GitHub — chỉ khác nguồn dữ liệu đầu vào.
// `raw` là lối thoát duy nhất khi adapter thất bại, và cũng là trường hợp DUY NHẤT mà
// trang cần gọi tới /preview.
// Mã tài liệu trong mục REFERENCES → đường dẫn mở được. Mặc định của exporter là
// `/view/{path}` (trình xem file GitHub), ở nhánh backend thì `path` là doc key nên link đó
// dẫn tới một file không tồn tại. resolvedLinks đã có sẵn id thật, dùng thẳng.
function storyLinkHref(doc: DocumentDetail) {
  const idByKey = new Map(
    doc.resolvedLinks
      .filter((l) => l.targetDocumentId)
      .map((l) => [l.targetDocKey, l.targetDocumentId!]),
  );
  // null = liên kết treo (trỏ tới khoá chưa tồn tại) → exporter in chữ thường, không tạo
  // link chết.
  return (ref: { id: string; path: string }) => {
    const id = idByKey.get(ref.path);
    return id ? `/projects/${doc.projectId}/documents/${id}` : null;
  };
}

export type DocumentView =
  | { kind: "pending" }
  | { kind: "story"; html: string }
  | { kind: "tdd"; data: TddSchema }
  | { kind: "rule"; data: RuleSchema }
  | { kind: "raw" };

export function buildDocumentView(
  doc: DocumentDetail | undefined,
): DocumentView {
  if (!doc) return { kind: "pending" };
  try {
    switch (doc.docType) {
      case DocumentType.UserStory:
        return {
          kind: "story",
          html: usToHtml(adaptUserStoryView(doc), {
            linkHref: storyLinkHref(doc),
          }),
        };
      case DocumentType.Tdd:
        return { kind: "tdd", data: adaptTdd(doc) };
      case DocumentType.BusinessRule:
        return { kind: "rule", data: adaptRule(doc) };
      default:
        return { kind: "raw" };
    }
  } catch {
    return { kind: "raw" };
  }
}
