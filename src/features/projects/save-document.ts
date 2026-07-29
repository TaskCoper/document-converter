import type { RuleSchema } from "@/features/business-rules/validations";
import type { TddSchema } from "@/features/tdds/validations";
import type { Schema as UsSchema } from "@/features/user-stories/validations";
import documentService from "./document-services";
import { PositionToAssigneeRole } from "./document-types";
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
  // Backend có StoryPriority.Wont = 4. Thiếu dòng này thì mọi story ưu tiên "Won't" bị đẩy
  // về null ngay lần lưu đầu tiên.
  "Won't": 4,
};

const LIST = {
  Precondition: 1,
  NonFunctional: 2,
  OutOfScope: 3,
  Assumption: 90,
  OpenQuestion: 91,
};
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

  // 3) Assignees. Ô chọn vị trí giờ có đủ 9 vai trò của backend nên map thẳng được.
  //    userId đi kèm trong form (ô ẩn) — gửi null sẽ cắt liên kết tài khoản của người phụ
  //    trách, và màn hình "tài liệu của tôi" lặng lẽ rỗng đi.
  await documentService.replaceAssignees(
    id,
    data.metadata.assignee
      .filter((a) => a.name.trim())
      .map((a) => ({
        role: PositionToAssigneeRole[a.position] ?? 1,
        displayName: a.name.trim(),
        userId: a.userId ?? null,
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
  await documentService.replaceListItems(
    id,
    LIST.Assumption,
    toItems(data.assumptions ?? []),
  );
  await documentService.replaceListItems(
    id,
    LIST.OpenQuestion,
    toItems(data.openQuestions ?? []),
  );

  // 5) Flows (main + alternative + exception).
  const flows: {
    flowType: number;
    code: string | null;
    title: string | null;
    steps: string[];
  }[] = [];
  // Tiêu đề luồng là dữ liệu người dùng nhập, không phải nhãn cố định: ghi cứng "Main Flow"
  // và null sẽ xoá sạch tiêu đề mọi luồng ngay lần lưu đầu.
  if (data.flow.mainFlow.some((s) => s.trim())) {
    flows.push({
      flowType: FLOW.Main,
      code: null,
      title: data.flow.mainFlowTitle?.trim() || null,
      steps: data.flow.mainFlow.filter((s) => s.trim()),
    });
  }
  for (const f of data.flow.alternativeFlow) {
    if (f.steps.some((s) => s.trim()))
      flows.push({
        flowType: FLOW.Alternative,
        code: f.code || null,
        title: f.title?.trim() || null,
        steps: f.steps.filter((s) => s.trim()),
      });
  }
  for (const f of data.flow.exceptionFlow) {
    if (f.steps.some((s) => s.trim()))
      flows.push({
        flowType: FLOW.Exception,
        code: f.code || null,
        title: f.title?.trim() || null,
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
  //
  // linkType là NGỮ NGHĨA CẠNH mà phân tích ảnh hưởng dựa vào (Phụ thuộc / Hiện thực hoá /
  // Chịu ràng buộc bởi / Chặn...). Ghi cứng References cho mọi cạnh là làm phẳng cả đồ thị,
  // và note của người dùng thì mất trắng.
  const link = (
    kind: number,
    r: { id: string; linkType?: number; note?: string },
  ) => ({
    targetKind: kind,
    targetDocKey: r.id,
    linkType: r.linkType ?? LINK_REFERENCES,
    note: r.note?.trim() || null,
  });
  await documentService.replaceLinks(id, [
    ...data.references.tdds.map((r) => link(REF.Tdd, r)),
    ...data.references.rules.map((r) => link(REF.BusinessRule, r)),
    ...data.references.dependencies.map((r) => link(REF.UserStory, r)),
  ]);

  // 8) Diagrams: CỐ Ý không đụng tới.
  //
  // Sơ đồ thuộc về TDD, trang sửa User Story không có ô nhập nào cho chúng. Mà bảng
  // document_diagrams thì dùng chung cho mọi loại tài liệu và dữ liệu mẫu có gắn sơ đồ vào cả
  // User Story (STORY-011 có 5 cái), nên "không gửi gì" ≠ "gửi mảng rỗng": gọi replaceDiagrams
  // với [] là xoá sạch chúng.
  //
  // Trước đây còn tệ hơn: nó gộp cả danh sách thành ĐÚNG MỘT sơ đồ Activity/ExternalUrl dựng
  // từ ô `activityDiagram`, nên mã nguồn Mermaid/PlantUML mất không lấy lại được.
  //
  // Cùng lý do với tagIds — không sửa được ở đây thì không ghi đè ở đây.
}

// ── TDD: Ánh xạ NGƯỢC TddSchema → section endpoint của backend ─────────────────────────
//
// Wizard trong project chỉ có 3 bước (Thông tin&Bối cảnh, Kiến trúc&Sơ đồ, Tham chiếu), nên
// TddSchema hẹp hơn hẳn thứ DB lưu được. NGUYÊN TẮC: cái gì form không biểu diễn được thì
// GIỮ NGUYÊN từ tài liệu đang có, tuyệt đối không gửi giá trị mặc định đè lên.
//
// Change Log là ngoại lệ duy nhất không cần giữ: nó sinh từ lịch sử phát hành, không phải dữ
// liệu nhập, và saveTdd không đụng tới.
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
const DIAG = { Activity: 1, Sequence: 2, State: 3, Architecture: 4, DataModel: 5 };
const DIAG_MERMAID = 1;
// Chiều ngược của HTTP trong adapt-document.ts.
const METHOD_TO_NUMBER: Record<string, number> = {
  GET: 1,
  POST: 2,
  PUT: 3,
  PATCH: 4,
  DELETE: 5,
  HEAD: 6,
  OPTIONS: 7,
};

/**
 * Nhãn của list item ("G1", "NG2", "Hợp đồng API đối tác") là dữ liệu người dùng nhập, nhưng
 * form chỉ có ô nội dung. Gửi `label: null` là xoá sạch chúng mỗi lần lưu.
 *
 * Ghép lại theo NỘI DUNG chứ không theo vị trí: nhãn kiểu G1/G2 là định danh để tham chiếu
 * chéo ("xem mục tiêu G2"), nó phải đi theo nội dung. Ghép theo chỉ số thì chỉ cần chèn/xoá
 * một dòng là mọi nhãn phía sau gán nhầm mục — sai lệch âm thầm, tệ hơn hẳn mất nhãn.
 */
const keepLabels = (
  existing: DocumentDetail,
  itemType: number,
  contents: string[],
) => {
  const labelByContent = new Map(
    existing.content.listItems
      .filter((i) => i.itemType === itemType && i.label)
      .map((i) => [i.content.trim(), i.label]),
  );
  return contents
    .filter((s) => s.trim())
    .map((s) => ({ label: labelByContent.get(s.trim()) ?? null, content: s }));
};

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
    externalErrorHandling: data.externalApi.errorHandling.trim() || null,
  });

  // Quirk (12), ApiField (16), Assumption (90), OpenQuestion (91) KHÔNG có trong form nên
  // cũng không gửi — replaceListItems chỉ thay đúng itemType được truyền vào, các loại khác
  // giữ nguyên.
  const items = (itemType: number, arr: string[]) =>
    documentService.replaceListItems(
      id,
      itemType,
      keepLabels(existing, itemType, arr),
    );
  await items(TLIST.Goal, data.contextGoals.goals);
  await items(TLIST.NonGoal, data.contextGoals.nonGoals);
  await items(TLIST.ArchNote, data.architecture.notes);
  await items(TLIST.DataNote, data.dataModel.notes);
  // ExtRef hiển thị/nhập dạng "nhãn: nội dung" (adaptTdd ghép, MarkdownParser.AddColonItems
  // cũng tách y hệt). Lưu nguyên chuỗi đã ghép sẽ nhét nhãn vào cột content và bỏ trống cột
  // label. Separator là ": " CÓ DẤU CÁCH — dùng ":" trần thì "https://..." bị cắt làm đôi.
  await documentService.replaceListItems(
    id,
    TLIST.ExtRef,
    data.references.others
      .filter((s) => s.trim())
      .map((s) => {
        const at = s.indexOf(": ");
        return at < 0
          ? { label: null, content: s.trim() }
          : { label: s.slice(0, at).trim(), content: s.slice(at + 2).trim() };
      }),
  );
  await items(TLIST.Quirk, data.externalApi.quirks);
  await items(TLIST.Assumption, data.assumptions ?? []);
  await items(TLIST.OpenQuestion, data.openQuestions ?? []);

  // ApiField dùng cặp nhãn/nội dung (tên field + ý nghĩa), không phải bullet thường.
  await documentService.replaceListItems(
    id,
    TLIST.ApiField,
    data.externalApi.fields
      .filter((f) => f.field.trim() || f.meaning.trim())
      .map((f) => ({ label: f.field.trim() || null, content: f.meaning })),
  );

  // ── Sơ đồ ──────────────────────────────────────────────────────────────────────────
  //
  // Form chỉ có 5 ô cố định (Architecture/Sequence/Activity/State/DataModel), mỗi ô đúng một
  // khung "mô tả + mã Mermaid". DB thì lưu cả tiêu đề, định dạng (Mermaid/PlantUML/URL/ảnh)
  // và mọi loại sơ đồ khác. Ba thứ phải giữ:
  //
  //  1. Sơ đồ loại KHÁC 5 ô trên (Flowchart, Other) — form không thấy chúng, gửi thiếu là xoá.
  //  2. Sơ đồ không phải Mermaid — ô "Mermaid" của form rỗng với chúng (adaptTdd cố ý không
  //     nạp mã PlantUML/URL vào bộ render Mermaid), nên ghi đè sẽ biến mã PlantUML thành null
  //     và gán nhầm định dạng thành Mermaid. Chỉ nhận `description` từ form, phần còn lại
  //     giữ nguyên.
  //  3. Tiêu đề — form không có ô nào cho nó.
  const byType = new Map(
    existing.content.diagrams.map((d) => [d.diagramType, d]),
  );
  const editable = new Set<number>(Object.values(DIAG));

  const diagrams = existing.content.diagrams
    .filter((d) => !editable.has(d.diagramType))
    .map((d) => ({
      diagramType: d.diagramType,
      format: d.format,
      title: d.title,
      description: d.description,
      sourceCode: d.sourceCode,
      externalUrl: d.externalUrl,
    }));

  const pushDiagram = (type: number, d: TddSchema["architecture"]) => {
    const prev = byType.get(type);
    const description = d.description.trim() || null;
    const mermaid = d.mermaid.trim() || null;

    if (prev && prev.format !== DIAG_MERMAID) {
      diagrams.push({ ...prev, description, title: d.title?.trim() || null });
      return;
    }
    // Không nhập gì và trước đó cũng chưa có gì → không tạo bản ghi rỗng.
    if (!description && !mermaid && !d.title?.trim()) return;

    diagrams.push({
      diagramType: type,
      format: DIAG_MERMAID,
      title: d.title?.trim() || null,
      description,
      sourceCode: mermaid,
      externalUrl: null,
    });
  };
  pushDiagram(DIAG.Architecture, data.architecture);
  pushDiagram(DIAG.Sequence, data.sequenceDiagram);
  pushDiagram(DIAG.Activity, data.activityDiagram);
  pushDiagram(DIAG.State, data.stateDiagram);
  pushDiagram(DIAG.DataModel, data.dataModel);
  await documentService.replaceDiagrams(id, diagrams);

  // ── API (endpoint + ví dụ + error code) ────────────────────────────────────────────
  //
  // Backend nhận cả hai trong MỘT request vì chúng cùng mô tả một hợp đồng API. Trước đây
  // trang sửa không gửi gì cả nên section này không đụng tới được từ giao diện.
  const toExamples = (
    exs?: TddSchema["internalApi"]["endpoints"][number]["examples"],
  ) =>
    (exs ?? [])
      .filter(
        (ex) =>
          ex.title?.trim() ||
          ex.requestSample?.trim() ||
          ex.responseSample?.trim() ||
          ex.errorSample?.trim(),
      )
      .map((ex) => ({
        title: ex.title?.trim() || null,
        requestSample: ex.requestSample?.trim() || null,
        responseSample: ex.responseSample?.trim() || null,
        responseStatus: ex.responseStatus ?? null,
        errorSample: ex.errorSample?.trim() || null,
      }));

  await documentService.replaceApi(id, {
    endpoints: [
      ...data.internalApi.endpoints
        .filter((e) => e.endpoint.trim())
        .map((e) => ({
          scope: 1,
          method: METHOD_TO_NUMBER[e.method] ?? 1,
          path: e.endpoint.trim(),
          name: e.name?.trim() || null,
          description: e.description.trim() || null,
          examples: toExamples(e.examples),
        })),
      ...data.externalApi.endpoints
        .filter((e) => e.endpoint.trim())
        .map((e) => ({
          scope: 2,
          method: e.method ? METHOD_TO_NUMBER[e.method] : null,
          path: e.endpoint.trim(),
          name: e.name?.trim() || null,
          description: e.purpose.trim() || null,
          examples: toExamples(e.examples),
        })),
    ],
    errorCodes: data.internalApi.errorCodes
      .filter((ec) => ec.code.trim())
      .map((ec) => ({
        code: ec.code.trim(),
        httpStatus: ec.http.trim() ? Number(ec.http) : null,
        description: ec.when.trim() || null,
      })),
  });

  // Links: "Story liên quan"/"Business Rules" xuất hiện ở CẢ bước Thông tin tài liệu lẫn
  // bước Tham chiếu (documentInfo.relatedStories/businessRules ↔ references.userStories/
  // businessRules) — cả hai đều đọc từ cùng một bảng links khi load (adaptTdd), nên khi lưu
  // gộp (hợp, khử trùng) hai nơi lại để không nơi nào ghi đè mất nơi kia.
  const dedupe = (arr: string[]) =>
    Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));

  // Nguồn của linkType/note là `linkMeta` — ô chọn loại + ô ghi chú ở bước Tham chiếu.
  //
  // Có bản ghi trong linkMeta thì TIN HOÀN TOÀN vào nó, kể cả khi note rỗng: đó là người dùng
  // vừa xoá ghi chú, rơi về giá trị cũ sẽ làm ghi chú sống lại. Chỉ cạnh KHÔNG có trong
  // linkMeta mới lấy lại giá trị cũ, rồi mới tới mặc định References.
  const metaByKey = new Map(
    (data.linkMeta ?? []).map((m) => [`${m.targetKind} ${m.targetDocKey}`, m]),
  );
  const prevByKey = new Map(
    existing.content.links.map((l) => [`${l.targetKind} ${l.targetDocKey}`, l]),
  );
  const link = (kind: number, key: string) => {
    const k = `${kind} ${key}`;
    const meta = metaByKey.get(k);
    if (meta) {
      return {
        targetKind: kind,
        targetDocKey: key,
        linkType: meta.linkType ?? LINK_REFERENCES,
        note: meta.note?.trim() || null,
      };
    }
    const prev = prevByKey.get(k);
    return {
      targetKind: kind,
      targetDocKey: key,
      linkType: prev?.linkType ?? LINK_REFERENCES,
      note: prev?.note ?? null,
    };
  };

  // Form chỉ có picker cho Story / Business Rule / Use Case. Cạnh TDD-TDD (ReferenceKind.Tdd)
  // không chọn/bỏ chọn được ở đâu cả, gửi thiếu là xoá luôn — mang nguyên si sang. Loại và ghi
  // chú của chúng thì vẫn sửa được, vì linkMeta có mặt cả những cạnh này.
  const editableKinds = new Set([REF.UserStory, REF.BusinessRule, 4]);
  const untouched = existing.content.links
    .filter((l) => !editableKinds.has(l.targetKind))
    .map((l) => link(l.targetKind, l.targetDocKey));

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
    ...untouched,
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
