import { z } from "zod";

export const Priority = {
  Must: "Must",
  Should: "Should",
  Could: "Could",
} as const;

type Priority = (typeof Priority)[keyof typeof Priority];

export const PriorityLabel: Record<Priority, string> = {
  [Priority.Must]: "Must",
  [Priority.Should]: "Should",
  [Priority.Could]: "Could",
};

export const Position = {
  FE: "FE",
  BE: "BE",
} as const;

type Position = (typeof Position)[keyof typeof Position];

export const PositionLabel: Record<Position, string> = {
  [Position.FE]: "Frontend",
  [Position.BE]: "Backend",
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

const assigneeSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  position: z.enum(Position, "Vị trí phải là FE hoặc BE"),
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
  assignee: z.array(assigneeSchema).min(1, "Phải có ít nhất một người phụ trách"),
  creator: z.string().min(1, "Không được để trống"),
  status: z.enum(
    Status,
    `Phải là một trong: ${Object.values(Status).join(", ")}`,
  ),
});

const conditionsSchema = z.object({
  preconditions: z.array(z.string().min(1, "Điều kiện tiên quyết không được để trống")),
  trigger: z.string().min(1, "Trigger không được để trống"),
});

const otherFlowSchema = z.object({
  code: z.string().min(1, "Mã luồng không được để trống"),
  steps: z.array(z.string().min(1, "Bước không được để trống")).min(1, "Phải có ít nhất một bước"),
});

const flowSchema = z.object({
  mainFlow: z.array(z.string().min(1, "Bước không được để trống")).min(1, "Luồng chính phải có ít nhất một bước"),
  alternativeFlow: z.array(otherFlowSchema),
  exceptionFlow: z.array(otherFlowSchema),
});

const acItemSchema = z.object({
  type: z.enum(CriteriaCondition),
  step: z.string().min(1, "Nội dung tiêu chí không được để trống"),
});

const acGroupSchema = z.object({
  code: z.string().min(1, "Mã tiêu chí không được để trống"),
  criterias: z.array(acItemSchema).min(1, "Phải có ít nhất một điều kiện"),
});

export const schema = z.object({
  metadata: metadataSchema,
  conditions: conditionsSchema,
  flow: flowSchema,
  acceptanceCriteria: z.array(acGroupSchema).min(1, "Phải có ít nhất một tiêu chí chấp nhận"),
  activityDiagram: z.url("Phải là URL hợp lệ"),
  references: z.object({
    businessRules: z.array(z.string().min(1, "Business rule không được để trống")),
    dependencies: z.array(z.string().min(1, "Dependency không được để trống")),
  }),
  nonFunctional: z.array(z.string().min(1, "Yêu cầu phi chức năng không được để trống")),
  outOfScope: z.array(z.string().min(1, "Nội dung ngoài phạm vi không được để trống")),
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
  activityDiagram: "Sơ đồ hoạt động",
  references: "Tài liệu tham khảo",
  businessRules: "Quy tắc nghiệp vụ",
  dependencies: "Phụ thuộc",
  nonFunctional: "Yêu cầu phi chức năng",
  outOfScope: "Ngoài phạm vi",
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
