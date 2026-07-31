import { z } from "zod";

// MoSCoW đủ 4 mức. Thiếu "Won't" thì story ưu tiên Won't ở backend (StoryPriority.Wont = 4)
// không chọn lại được và bị đẩy về null ngay lần lưu đầu.
export const Priority = {
  Must: "Must",
  Should: "Should",
  Could: "Could",
  Wont: "Won't",
} as const;

type Priority = (typeof Priority)[keyof typeof Priority];

export const PriorityLabel: Record<Priority, string> = {
  [Priority.Must]: "Must",
  [Priority.Should]: "Should",
  [Priority.Could]: "Could",
  [Priority.Wont]: "Won't",
};

// Khớp trọn AssigneeRole của backend (Frontend=1 … Other=99). Trước đây chỉ có FE/BE, nên
// mọi vai trò khác hiện ra là "FE" và bị ghi đè thành Frontend khi lưu.
//
// Nhãn ở PositionLabel chính là chữ ghi vào Markdown; thêm giá trị mới là mở rộng thuần —
// tài liệu cũ chỉ có Frontend/Backend vẫn parse nguyên như trước.
export const Position = {
  FE: "FE",
  BE: "BE",
  Fullstack: "Fullstack",
  Mobile: "Mobile",
  QA: "QA",
  DevOps: "DevOps",
  Designer: "Designer",
  Reviewer: "Reviewer",
  Other: "Other",
} as const;

type Position = (typeof Position)[keyof typeof Position];

export const PositionLabel: Record<Position, string> = {
  [Position.FE]: "Frontend",
  [Position.BE]: "Backend",
  [Position.Fullstack]: "Fullstack",
  [Position.Mobile]: "Mobile",
  [Position.QA]: "QA",
  [Position.DevOps]: "DevOps",
  [Position.Designer]: "Designer",
  [Position.Reviewer]: "Reviewer",
  [Position.Other]: "Other",
};

export const Status = {
  Documentation: "Documentation",
  Pending: "Pending",
  InProgress: "InProgress",
  Done: "Done",
} as const;

type Status = (typeof Status)[keyof typeof Status];

export const StatusLabel: Record<Status, string> = {
  [Status.Documentation]: "Documentation",
  [Status.Pending]: "Pending",
  [Status.InProgress]: "In Progress",
  [Status.Done]: "Done",
};

export const CriteriaCondition = {
  Given: "Given",
  When: "When",
  Then: "Then",
  And: "And",
} as const;

type CriteriaCondition =
  (typeof CriteriaCondition)[keyof typeof CriteriaCondition];

export const CriteriaConditionLabel: Record<CriteriaCondition, string> = {
  [CriteriaCondition.Given]: "Given",
  [CriteriaCondition.When]: "When",
  [CriteriaCondition.Then]: "Then",
  [CriteriaCondition.And]: "And",
};

// ── Field CHỈ có ở nhánh backend ────────────────────────────────────────────────────────
// Nguồn GitHub là Markdown, nguồn backend là DB — DB giữ được nhiều thứ hơn Markdown (loại
// liên kết, ghi chú liên kết, tiêu đề luồng, nhiều sơ đồ, giả định, câu hỏi mở, liên kết tài
// khoản của người phụ trách).
//
// Tất cả để optional một cách CÓ CHỦ Ý: toMarkdown không ghi và fromMarkdown không đọc chúng,
// nên định dạng Markdown — hợp đồng dùng chung giữa hai nhánh — không đổi một ký tự. Nhánh
// GitHub cứ để trống và chạy y như cũ.

const assigneeSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  position: z.enum(
    Position,
    `Vị trí phải là một trong: ${Object.values(Position).join(", ")}`,
  ),
  /** Liên kết tài khoản. Mất nó thì màn hình "tài liệu của tôi" lặng lẽ rỗng đi. */
  userId: z.string().nullish(),
});

const metadataSchema = z.object({
  id: z.string().min(1, "Không được để trống"),
  story: z.string().min(1, "Không được để trống"),
  context: z.string().min(1, "Không được để trống"),
  sprint: z.number({ error: "Phải là số" }).positive("Phải là số dương"),
  priority: z.enum(
    Priority,
    `Phải là một trong: ${Object.values(Priority).join(", ")}`,
  ),
  assignee: z
    .array(assigneeSchema)
    .min(1, "Phải có ít nhất một người phụ trách"),
  creator: z.string().min(1, "Không được để trống"),
  status: z.enum(
    Status,
    `Phải là một trong: ${Object.values(Status).join(", ")}`,
  ),
});

const conditionsSchema = z.object({
  preconditions: z.array(
    z.string().min(1, "Điều kiện tiên quyết không được để trống"),
  ),
  trigger: z.string().min(1, "Trigger không được để trống"),
});

const otherFlowSchema = z.object({
  code: z.string().min(1, "Mã luồng không được để trống"),
  steps: z
    .array(z.string().min(1, "Bước không được để trống"))
    .min(1, "Phải có ít nhất một bước"),
  /** Chỉ backend: document_flows.title, ví dụ "Khách đổi mã giảm giá khác". */
  title: z.string().optional(),
});

const flowSchema = z.object({
  mainFlow: z
    .array(z.string().min(1, "Bước không được để trống"))
    .min(1, "Luồng chính phải có ít nhất một bước"),
  alternativeFlow: z.array(otherFlowSchema),
  exceptionFlow: z.array(otherFlowSchema),
  /** Chỉ backend: tiêu đề của luồng chính. Trước đây bị ghi cứng thành "Main Flow". */
  mainFlowTitle: z.string().optional(),
});

const acItemSchema = z.object({
  type: z.enum(CriteriaCondition),
  step: z.string().min(1, "Nội dung tiêu chí không được để trống"),
});

const acGroupSchema = z.object({
  code: z.string().min(1, "Mã tiêu chí không được để trống"),
  criterias: z.array(acItemSchema).min(1, "Phải có ít nhất một điều kiện"),
});

const linkRefSchema = z.object({
  id: z.string().min(1, "ID không được để trống"),
  path: z.string().min(1, "Đường dẫn không được để trống"),
  /**
   * Chỉ backend: document_links.link_type (DocumentLinkType 1-7). Đây là NGỮ NGHĨA CẠNH mà
   * phân tích ảnh hưởng dựa vào — ghi cứng thành References là mất khả năng trả lời "sửa
   * BR-007 thì ảnh hưởng gì".
   */
  linkType: z.number().optional(),
  /** Chỉ backend: document_links.note. */
  note: z.string().optional(),
});

export const schema = z.object({
  metadata: metadataSchema,
  conditions: conditionsSchema,
  flow: flowSchema,
  acceptanceCriteria: z
    .array(acGroupSchema)
    .min(1, "Phải có ít nhất một tiêu chí chấp nhận"),
  references: z.object({
    tdds: z.array(linkRefSchema),
    rules: z.array(linkRefSchema),
    dependencies: z.array(linkRefSchema),
  }),
  nonFunctional: z.array(
    z.string().min(1, "Yêu cầu phi chức năng không được để trống"),
  ),
  outOfScope: z.array(
    z.string().min(1, "Nội dung ngoài phạm vi không được để trống"),
  ),
  /** Chỉ backend: document_list_items itemType = Assumption (90). */
  assumptions: z.array(z.string()).optional(),
  /** Chỉ backend: document_list_items itemType = OpenQuestion (91). */
  openQuestions: z.array(z.string()).optional(),
});

const userIdSchema = z.string().uuid();

/**
 * Nhánh project/backend không cho nhập tên tự do: mỗi assignee phải trỏ tới một user.
 * Backend vẫn là lớp bảo vệ cuối và kiểm thêm user đó có thuộc đúng project hay không.
 */
export const backendSchema = schema.superRefine((data, ctx) => {
  const assignments = new Set<string>();

  data.metadata.assignee.forEach((assignee, index) => {
    if (
      !assignee.userId ||
      !userIdSchema.safeParse(assignee.userId).success
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Hãy chọn một thành viên trong dự án",
        path: ["metadata", "assignee", index, "userId"],
      });
      return;
    }

    const assignment = `${assignee.userId}:${assignee.position}`;
    if (assignments.has(assignment)) {
      ctx.addIssue({
        code: "custom",
        message: "Thành viên đã được giao vai trò này",
        path: ["metadata", "assignee", index, "userId"],
      });
      return;
    }

    assignments.add(assignment);
  });
});

export type Schema = z.infer<typeof schema>;

const fieldNameLabels: Record<string, string> = {
  metadata: "Thông tin chung",
  id: "ID",
  story: "User Story",
  context: "Ngữ cảnh",
  sprint: "Sprint",
  priority: "Độ ưu tiên",
  creator: "Người tạo",
  status: "Trạng thái",
  assignee: "Người phụ trách",
  name: "Tên",
  position: "Vị trí",
  conditions: "Điều kiện",
  preconditions: "Điều kiện tiên quyết",
  trigger: "Trigger",
  flow: "Luồng",
  mainFlow: "Luồng chính",
  alternativeFlow: "Luồng thay thế",
  exceptionFlow: "Luồng ngoại lệ",
  code: "Mã",
  steps: "Bước",
  acceptanceCriteria: "Tiêu chí chấp nhận",
  criterias: "Điều kiện",
  type: "Loại",
  step: "Nội dung",
  references: "Tài liệu tham khảo",
  dependencies: "Phụ thuộc (Stories)",
  tdds: "TDDs",
  rules: "Rules",
  path: "Đường dẫn",
  nonFunctional: "Yêu cầu phi chức năng",
  outOfScope: "Ngoài phạm vi",
  title: "Tiêu đề",
  note: "Ghi chú",
  linkType: "Loại liên kết",
  assumptions: "Giả định",
  openQuestions: "Câu hỏi mở",
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
