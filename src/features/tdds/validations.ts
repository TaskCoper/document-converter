import { z } from "zod";

export const DocStatus = {
  Draft: "Draft",
  InReview: "InReview",
  Approved: "Approved",
} as const;

type DocStatus = (typeof DocStatus)[keyof typeof DocStatus];

export const DocStatusLabel: Record<DocStatus, string> = {
  [DocStatus.Draft]: "Draft",
  [DocStatus.InReview]: "In Review",
  [DocStatus.Approved]: "Approved",
};

// Khớp trọn ApiHttpMethod của backend (Get=1 … Options=7). Thiếu HEAD/OPTIONS thì hai động từ
// đó bị nắn về GET — bảng endpoint hiện sai hẳn ý nghĩa (HEAD "không tải nội dung", OPTIONS
// preflight đều thành GET).
export const HttpMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
  HEAD: "HEAD",
  OPTIONS: "OPTIONS",
} as const;

type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

export const HttpMethodLabel: Record<HttpMethod, string> = {
  [HttpMethod.GET]: "GET",
  [HttpMethod.POST]: "POST",
  [HttpMethod.PUT]: "PUT",
  [HttpMethod.PATCH]: "PATCH",
  [HttpMethod.DELETE]: "DELETE",
  [HttpMethod.HEAD]: "HEAD",
  [HttpMethod.OPTIONS]: "OPTIONS",
};

const documentInfoSchema = z.object({
  docId: z.string().min(1, "Không được để trống"),
  feature: z.string().min(1, "Không được để trống"),
  author: z.string().min(1, "Không được để trống"),
  reviewer: z.string().min(1, "Không được để trống"),
  status: z.enum(
    DocStatus,
    `Phải là một trong: ${Object.values(DocStatus).join(", ")}`,
  ),
  version: z.string().min(1, "Không được để trống"),
  updatedAt: z.string().min(1, "Không được để trống"),
  relatedStories: z.array(z.string().min(1, "Không được để trống")),
  businessRules: z.array(z.string().min(1, "Không được để trống")),
});

const contextGoalsSchema = z.object({
  problem: z.string().min(1, "Không được để trống"),
  goals: z
    .array(z.string().min(1, "Không được để trống"))
    .min(1, "Phải có ít nhất một mục tiêu"),
  nonGoals: z.array(z.string().min(1, "Không được để trống")),
});

const diagramSectionSchema = z.object({
  description: z.string(),
  mermaid: z.string(),
  notes: z.array(z.string().min(1, "Ghi chú không được để trống")),
  /** Chỉ backend: document_diagrams.title. */
  title: z.string().optional(),
  /** Chỉ backend: DiagramFormat 1-4. Khác Mermaid thì nội dung nằm ở sourceCode/externalUrl. */
  format: z.number().optional(),
  sourceCode: z.string().optional(),
  externalUrl: z.string().optional(),
});

/** Chỉ backend: sơ đồ không thuộc 5 ô cố định của form (Flowchart, Other…). */
const extraDiagramSchema = z.object({
  diagramType: z.number(),
  format: z.number(),
  title: z.string().optional(),
  description: z.string().optional(),
  sourceCode: z.string().optional(),
  externalUrl: z.string().optional(),
});

// ── Field CHỈ có ở nhánh backend ────────────────────────────────────────────────────────
// Nguồn GitHub là Markdown, nguồn backend là DB. Tất cả để optional một cách CÓ CHỦ Ý:
// toMarkdown không ghi và fromMarkdown không đọc chúng, nên định dạng Markdown — hợp đồng
// dùng chung giữa hai nhánh — không đổi một ký tự.

/**
 * Một ví dụ, giữ nguyên ba mẫu tách rời như DB lưu.
 *
 * `apiExampleSchema` cũ gộp cả ba vào một chuỗi `content` và chỉ chọn được MỘT (ưu tiên
 * response), nên request và error của cùng một ví dụ biến mất. Nó cũng nằm phẳng ở
 * `internalApi.examples`, mất luôn thông tin ví dụ thuộc endpoint nào.
 */
const apiExampleDetailSchema = z.object({
  title: z.string(),
  requestSample: z.string().optional(),
  responseSample: z.string().optional(),
  responseStatus: z.number().nullish(),
  errorSample: z.string().optional(),
});

const apiEndpointSchema = z.object({
  endpoint: z.string().min(1, "Endpoint không được để trống"),
  method: z.enum(HttpMethod),
  description: z.string().min(1, "Mô tả không được để trống"),
  /** Chỉ backend: api_endpoints.name ("Danh sách gói combo"). */
  name: z.string().optional(),
  /** Chỉ backend: ví dụ THUỘC endpoint này. */
  examples: z.array(apiExampleDetailSchema).optional(),
});

const apiExampleSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  content: z.string().min(1, "Nội dung không được để trống"),
});

const errorCodeSchema = z.object({
  code: z.string().min(1, "Code không được để trống"),
  http: z.string().min(1, "HTTP status không được để trống"),
  when: z.string().min(1, "Không được để trống"),
});

const internalApiSchema = z.object({
  endpoints: z.array(apiEndpointSchema),
  examples: z.array(apiExampleSchema),
  errorCodes: z.array(errorCodeSchema),
});

const externalEndpointSchema = z.object({
  endpoint: z.string().min(1, "Endpoint không được để trống"),
  purpose: z.string().min(1, "Mục đích không được để trống"),
  note: z.string(),
  /** Chỉ backend: endpoint đối tác cũng có động từ, tên và ví dụ như endpoint nội bộ. */
  name: z.string().optional(),
  method: z.enum(HttpMethod).optional(),
  examples: z.array(apiExampleDetailSchema).optional(),
});

const externalFieldSchema = z.object({
  field: z.string().min(1, "Field không được để trống"),
  meaning: z.string().min(1, "Ý nghĩa không được để trống"),
  note: z.string(),
});

const externalApiSchema = z.object({
  endpoints: z.array(externalEndpointSchema),
  fields: z.array(externalFieldSchema),
  errorHandling: z.string(),
  quirks: z.array(z.string().min(1, "Ghi chú không được để trống")),
});

const referencesSchema = z.object({
  userStories: z.array(z.string().min(1, "Không được để trống")),
  businessRules: z.array(z.string().min(1, "Không được để trống")),
  useCases: z.array(z.string().min(1, "Không được để trống")),
  others: z.array(z.string().min(1, "Không được để trống")),
});

/** Chỉ backend: nhãn của list item (G1, NG2…) — Markdown của TDD không có chỗ chứa. */
const labelledItemSchema = z.object({
  label: z.string().nullish(),
  content: z.string(),
});

const changeLogEntrySchema = z.object({
  date: z.string().min(1, "Ngày không được để trống"),
  version: z.string().min(1, "Phiên bản không được để trống"),
  change: z.string().min(1, "Thay đổi không được để trống"),
  author: z.string().min(1, "Người thực hiện không được để trống"),
});

export const tddSchema = z.object({
  documentInfo: documentInfoSchema,
  contextGoals: contextGoalsSchema,
  architecture: diagramSectionSchema,
  sequenceDiagram: diagramSectionSchema,
  activityDiagram: diagramSectionSchema,
  stateDiagram: diagramSectionSchema,
  dataModel: diagramSectionSchema,
  internalApi: internalApiSchema,
  externalApi: externalApiSchema,
  references: referencesSchema,
  changeLog: z.array(changeLogEntrySchema),
  /** Chỉ backend: sơ đồ ngoài 5 ô cố định. */
  extraDiagrams: z.array(extraDiagramSchema).optional(),
  /** Chỉ backend: document_list_items 90 / 91. */
  assumptions: z.array(z.string()).optional(),
  openQuestions: z.array(z.string()).optional(),
  /** Chỉ backend: nhãn G1/NG2 của Goals & Non-goals, đi song song với contextGoals. */
  goalLabels: z.array(labelledItemSchema).optional(),
  nonGoalLabels: z.array(labelledItemSchema).optional(),
  /**
   * Chỉ backend: loại cạnh + ghi chú cho từng liên kết.
   *
   * Tách thành mảng riêng thay vì nhét vào `references.*` (đang là `string[]`): đổi ba mảng đó
   * sang object sẽ kéo theo toMarkdown/fromMarkdown của TDD, tức là đụng định dạng Markdown —
   * hợp đồng dùng chung với nhánh GitHub. Mảng này Markdown không biết tới nên không ảnh hưởng.
   *
   * Khoá là cặp (targetKind, targetDocKey). Chứa CẢ cạnh TDD→TDD, thứ không có picker riêng.
   */
  linkMeta: z
    .array(
      z.object({
        targetKind: z.number(),
        targetDocKey: z.string(),
        linkType: z.number().optional(),
        note: z.string().optional(),
      }),
    )
    .optional(),
});

export type TddSchema = z.infer<typeof tddSchema>;

const fieldNameLabels: Record<string, string> = {
  documentInfo: "Thông tin tài liệu",
  docId: "Mã tài liệu",
  feature: "Tính năng",
  author: "Tác giả",
  reviewer: "Người review",
  status: "Trạng thái",
  version: "Phiên bản",
  updatedAt: "Cập nhật",
  relatedStories: "Story liên quan",
  businessRules: "Business Rules",
  contextGoals: "Bối cảnh & Mục tiêu",
  problem: "Vấn đề",
  goals: "Mục tiêu",
  nonGoals: "Ngoài phạm vi",
  architecture: "Kiến trúc",
  sequenceDiagram: "Sequence Diagram",
  activityDiagram: "Activity Diagram",
  stateDiagram: "State Diagram",
  dataModel: "Mô hình dữ liệu",
  description: "Mô tả",
  mermaid: "Mermaid",
  notes: "Ghi chú",
  internalApi: "API nội bộ",
  externalApi: "API bên ngoài",
  endpoints: "Endpoints",
  endpoint: "Endpoint",
  method: "Method",
  examples: "Ví dụ",
  title: "Tiêu đề",
  content: "Nội dung",
  errorCodes: "Mã lỗi",
  code: "Code",
  http: "HTTP",
  when: "Khi nào",
  fields: "Fields",
  field: "Field",
  meaning: "Ý nghĩa",
  note: "Ghi chú",
  errorHandling: "Xử lý lỗi",
  quirks: "Quirks",
  references: "Tham chiếu",
  userStories: "User Stories",
  useCases: "Use Cases",
  others: "Khác",
  changeLog: "Lịch sử thay đổi",
  date: "Ngày",
  change: "Thay đổi",
};

export function pathToLabel(path: (string | number)[]): string {
  return path
    .map((segment) =>
      typeof segment === "number"
        ? `#${segment + 1}`
        : (fieldNameLabels[segment] ?? segment),
    )
    .join(" › ");
}
