import { z } from "zod";

export const RuleStatus = {
  Active: "Active",
  Draft: "Draft",
  InReview: "InReview",
  Deprecated: "Deprecated",
} as const;

type RuleStatus = (typeof RuleStatus)[keyof typeof RuleStatus];

export const RuleStatusLabel: Record<RuleStatus, string> = {
  [RuleStatus.Active]: "Active",
  [RuleStatus.Draft]: "Draft",
  [RuleStatus.InReview]: "In Review",
  [RuleStatus.Deprecated]: "Deprecated",
};

export const ruleSchema = z.object({
  ruleId: z.string().min(1, "Không được để trống"),
  name: z.string().min(1, "Không được để trống"),
  category: z.string().min(1, "Không được để trống"),
  statement: z.string().min(1, "Không được để trống"),
  when: z.string().min(1, "Không được để trống"),
  then: z.string().min(1, "Không được để trống"),
  except: z.string(),
  source: z.string().min(1, "Không được để trống"),
  owner: z.string().min(1, "Không được để trống"),
  relatedStories: z.array(z.string().min(1, "Không được để trống")),
  status: z.enum(
    RuleStatus,
    `Phải là một trong: ${Object.values(RuleStatus).join(", ")}`,
  ),
  version: z.string().min(1, "Không được để trống"),
  effectiveDate: z.string().min(1, "Không được để trống"),
  notes: z.string(),
});

export type RuleSchema = z.infer<typeof ruleSchema>;

const fieldNameLabels: Record<string, string> = {
  ruleId: "Rule ID",
  name: "Tên rule",
  category: "Danh mục",
  statement: "Phát biểu",
  when: "Điều kiện (When)",
  then: "Hành vi (Then)",
  except: "Ngoại lệ (Except)",
  source: "Nguồn",
  owner: "Người sở hữu",
  relatedStories: "Story liên quan",
  status: "Trạng thái",
  version: "Version",
  effectiveDate: "Ngày hiệu lực",
  notes: "Ghi chú / Link logic",
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
