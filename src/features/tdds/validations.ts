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

export const HttpMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

export const HttpMethodLabel: Record<HttpMethod, string> = {
  [HttpMethod.GET]: "GET",
  [HttpMethod.POST]: "POST",
  [HttpMethod.PUT]: "PUT",
  [HttpMethod.PATCH]: "PATCH",
  [HttpMethod.DELETE]: "DELETE",
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
});

const apiEndpointSchema = z.object({
  endpoint: z.string().min(1, "Endpoint không được để trống"),
  method: z.enum(HttpMethod),
  description: z.string().min(1, "Mô tả không được để trống"),
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
