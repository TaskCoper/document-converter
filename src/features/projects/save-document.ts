import type { RuleSchema } from "@/features/business-rules/validations";
import type { TddSchema } from "@/features/tdds/validations";
import type { Schema as UsSchema } from "@/features/user-stories/validations";
import documentService from "./document-services";
import type { DocumentDetail, LifecycleState } from "./document-types";

// Metadata mức tài liệu (nhập ngay trong UI sửa nội dung, không nằm trong US Schema).
export interface DocumentMeta {
  title: string;
  status: number;
  lifecycleState: number;
  notesMd: string | null;
}

// Ánh xạ NGƯỢC: Schema của user-stories (form cũ) → các section endpoint của backend.
// Mỗi section được thay trọn. Field metadata KHÔNG thuộc form US (title/status/lifecycle/
// owner/notes...) được giữ nguyên từ tài liệu đang có.

const PRIORITY_TO_NUMBER: Record<string, number> = {
  Must: 1,
  Should: 2,
  Could: 3,
};

const LIST = { Precondition: 1, NonFunctional: 2, OutOfScope: 3 };
const FLOW = { Main: 1, Alternative: 2, Exception: 3 };
const REF = { UserStory: 1, Tdd: 2, BusinessRule: 3 };
const LINK_REFERENCES = 1; // DocumentLinkType.References

export async function saveUserStory(
  existing: DocumentDetail,
  data: UsSchema,
  meta: DocumentMeta,
): Promise<void> {
  const id = existing.id;

  // 1) Metadata: title/status/lifecycle/notes nhập trong UI; sprint/priority từ form US;
  //    owner/category/effectiveDate giữ nguyên (không sửa ở đây).
  await documentService.updateMetadata(id, {
    title: meta.title,
    status: meta.status,
    lifecycleState: meta.lifecycleState as LifecycleState,
    ownerId: existing.ownerId,
    sprint: data.metadata.sprint,
    priority: PRIORITY_TO_NUMBER[data.metadata.priority] ?? null,
    category: existing.content.category,
    effectiveDate: existing.content.effectiveDate,
    notesMd: meta.notesMd,
  });

  // 2) Detail (field đơn trị của US).
  await documentService.updateDetail(id, {
    storyStatement: data.metadata.story || null,
    context: data.metadata.context || null,
    trigger: data.conditions.trigger || null,
  });

  // 3) Assignees.
  await documentService.replaceAssignees(
    id,
    data.metadata.assignee
      .filter((a) => a.name.trim())
      .map((a) => ({
        role: a.position === "BE" ? 2 : 1,
        displayName: a.name.trim(),
        userId: null,
      })),
  );

  // 4) List sections.
  const toItems = (arr: string[]) =>
    arr.filter((s) => s.trim()).map((s) => ({ label: null, content: s }));
  await documentService.replaceListItems(
    id,
    LIST.Precondition,
    toItems(data.conditions.preconditions),
  );
  await documentService.replaceListItems(
    id,
    LIST.NonFunctional,
    toItems(data.nonFunctional),
  );
  await documentService.replaceListItems(
    id,
    LIST.OutOfScope,
    toItems(data.outOfScope),
  );

  // 5) Flows (main + alternative + exception).
  const flows: {
    flowType: number;
    code: string | null;
    title: string | null;
    steps: string[];
  }[] = [];
  if (data.flow.mainFlow.some((s) => s.trim())) {
    flows.push({
      flowType: FLOW.Main,
      code: null,
      title: "Main Flow",
      steps: data.flow.mainFlow.filter((s) => s.trim()),
    });
  }
  for (const f of data.flow.alternativeFlow) {
    if (f.steps.some((s) => s.trim()))
      flows.push({
        flowType: FLOW.Alternative,
        code: f.code || null,
        title: null,
        steps: f.steps.filter((s) => s.trim()),
      });
  }
  for (const f of data.flow.exceptionFlow) {
    if (f.steps.some((s) => s.trim()))
      flows.push({
        flowType: FLOW.Exception,
        code: f.code || null,
        title: null,
        steps: f.steps.filter((s) => s.trim()),
      });
  }
  await documentService.replaceFlows(id, flows);

  // 6) Acceptance criteria.
  await documentService.replaceAcceptanceCriteria(
    id,
    data.acceptanceCriteria
      .filter((g) => g.code.trim())
      .map((g) => ({
        code: g.code,
        givenText: g.criterias.find((c) => c.type === "Given")?.step ?? "",
        whenText: g.criterias.find((c) => c.type === "When")?.step ?? "",
        thenText: g.criterias.find((c) => c.type === "Then")?.step ?? "",
        andConditions: g.criterias
          .filter((c) => c.type === "And")
          .map((c) => c.step),
      })),
  );

  // 7) Links (references).
  const link = (kind: number, r: { id: string }) => ({
    targetKind: kind,
    targetDocKey: r.id,
    linkType: LINK_REFERENCES,
    note: null,
  });
  await documentService.replaceLinks(id, [
    ...data.references.tdds.map((r) => link(REF.Tdd, r)),
    ...data.references.rules.map((r) => link(REF.BusinessRule, r)),
    ...data.references.dependencies.map((r) => link(REF.UserStory, r)),
  ]);

  // 8) Activity diagram (URL) → 1 diagram External URL.
  await documentService.replaceDiagrams(
    id,
    data.activityDiagram?.trim()
      ? [
          {
            diagramType: 1, // Activity
            format: 2, // ExternalUrl
            externalUrl: data.activityDiagram.trim(),
          },
        ]
      : [],
  );
}

// ── TDD: Ánh xạ NGƯỢC TddSchema → section endpoint của backend ─────────────────────────
// Wizard trong project CHỈ có 3/5 bước của tdd.page.tsx (Thông tin&Bối cảnh, Kiến trúc&Sơ đồ,
// Tham chiếu) — bỏ API nội bộ/bên ngoài/Change Log vì backend chưa có endpoint replace cho
// endpoints/errorCodes/changeLog. externalErrorHandling (thuộc bước bị bỏ) được giữ nguyên
// giá trị cũ thay vì xoá.
const TLIST = {
  Goal: 10,
  NonGoal: 11,
  ArchNote: 13,
  DataNote: 14,
  ExtRef: 15,
};
const DIAG = { Activity: 1, Sequence: 2, State: 3, Architecture: 4, DataModel: 5 };

export async function saveTdd(
  existing: DocumentDetail,
  data: TddSchema,
  meta: DocumentMeta,
): Promise<void> {
  const id = existing.id;

  await documentService.updateMetadata(id, {
    title: meta.title,
    status: meta.status,
    lifecycleState: meta.lifecycleState as LifecycleState,
    ownerId: existing.ownerId,
    sprint: existing.content.sprint,
    priority: existing.content.priority,
    category: existing.content.category,
    effectiveDate: existing.content.effectiveDate,
    notesMd: meta.notesMd,
  });

  await documentService.updateDetail(id, {
    featureName: data.documentInfo.feature || null,
    problem: data.contextGoals.problem || null,
    reviewerName: data.documentInfo.reviewer || null,
    externalErrorHandling: existing.content.externalErrorHandling,
  });

  const toItems = (arr: string[]) =>
    arr.filter((s) => s.trim()).map((s) => ({ label: null, content: s }));
  await documentService.replaceListItems(
    id,
    TLIST.Goal,
    toItems(data.contextGoals.goals),
  );
  await documentService.replaceListItems(
    id,
    TLIST.NonGoal,
    toItems(data.contextGoals.nonGoals),
  );
  await documentService.replaceListItems(
    id,
    TLIST.ArchNote,
    toItems(data.architecture.notes),
  );
  await documentService.replaceListItems(
    id,
    TLIST.DataNote,
    toItems(data.dataModel.notes),
  );
  await documentService.replaceListItems(
    id,
    TLIST.ExtRef,
    toItems(data.references.others),
  );

  // Diagram nào không nhập gì (mô tả + mermaid rỗng) thì bỏ khỏi mảng thay vì gửi rỗng.
  const diagrams: {
    diagramType: number;
    format: number;
    description: string | null;
    sourceCode: string | null;
  }[] = [];
  const pushDiagram = (type: number, d: TddSchema["architecture"]) => {
    if (!d.description.trim() && !d.mermaid.trim()) return;
    diagrams.push({
      diagramType: type,
      format: 1, // Mermaid
      description: d.description.trim() || null,
      sourceCode: d.mermaid.trim() || null,
    });
  };
  pushDiagram(DIAG.Architecture, data.architecture);
  pushDiagram(DIAG.Sequence, data.sequenceDiagram);
  pushDiagram(DIAG.Activity, data.activityDiagram);
  pushDiagram(DIAG.State, data.stateDiagram);
  pushDiagram(DIAG.DataModel, data.dataModel);
  await documentService.replaceDiagrams(id, diagrams);

  // Links: "Story liên quan"/"Business Rules" xuất hiện ở CẢ bước Thông tin tài liệu lẫn
  // bước Tham chiếu (documentInfo.relatedStories/businessRules ↔ references.userStories/
  // businessRules) — cả hai đều đọc từ cùng một bảng links khi load (adaptTdd), nên khi lưu
  // gộp (hợp, khử trùng) hai nơi lại để không nơi nào ghi đè mất nơi kia.
  const dedupe = (arr: string[]) =>
    Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
  const link = (kind: number, key: string) => ({
    targetKind: kind,
    targetDocKey: key,
    linkType: LINK_REFERENCES,
    note: null,
  });
  await documentService.replaceLinks(id, [
    ...dedupe([
      ...data.documentInfo.relatedStories,
      ...data.references.userStories,
    ]).map((k) => link(REF.UserStory, k)),
    ...dedupe([
      ...data.documentInfo.businessRules,
      ...data.references.businessRules,
    ]).map((k) => link(REF.BusinessRule, k)),
    ...dedupe(data.references.useCases).map((k) => link(4, k)), // ReferenceKind.UseCase
  ]);
}

// ── Business Rule: Ánh xạ NGƯỢC RuleSchema → section endpoint của backend ──────────────
export async function saveRule(
  existing: DocumentDetail,
  data: RuleSchema,
  meta: DocumentMeta,
): Promise<void> {
  const id = existing.id;

  await documentService.updateMetadata(id, {
    title: meta.title,
    status: meta.status,
    lifecycleState: meta.lifecycleState as LifecycleState,
    ownerId: existing.ownerId,
    sprint: existing.content.sprint,
    priority: existing.content.priority,
    category: data.category.trim() || null,
    effectiveDate: data.effectiveDate.trim() || null,
    notesMd: meta.notesMd,
  });

  await documentService.updateDetail(id, {
    ruleName: data.name || null,
    statement: data.statement || null,
    whenCondition: data.when || null,
    thenAction: data.then || null,
    exceptCondition: data.except || null,
    notes: data.notes || null,
    ownerName: data.owner || null,
    source: data.source || null,
  });

  await documentService.replaceLinks(
    id,
    data.relatedStories
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({
        targetKind: REF.UserStory,
        targetDocKey: s,
        linkType: LINK_REFERENCES,
        note: null,
      })),
  );
}
