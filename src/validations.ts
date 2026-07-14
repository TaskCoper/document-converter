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
  name: z.string().min(1),
  position: z.enum(Position),
});

const metadataSchema = z.object({
  id: z.string().min(1),
  story: z.string().min(1),
  context: z.string().min(1),
  sprint: z.number().positive(),
  priority: z.enum(Priority),
  assignee: z.array(assigneeSchema),
  creator: z.string().min(1),
  status: z.enum(Status),
});

const conditionsSchema = z.object({
  preconditions: z.array(z.string()),
  trigger: z.string(),
});

const otherFlowSchema = z.object({
  code: z.string(),
  steps: z.array(z.string()),
});

const flowSchema = z.object({
  mainFlow: z.array(z.string()),
  alternativeFlow: z.array(otherFlowSchema),
  exceptionFlow: z.array(otherFlowSchema),
});

const acceptanceCriteriaSchema = z.object({
  type: z.enum(CriteriaCondition),
  step: z.string(),
});

export const schema = z.object({
  metadata: metadataSchema,
  conditions: conditionsSchema,
  flow: flowSchema,
  acceptanceCriteria: z.object({
    code: z.string(),
    criterias: z.array(acceptanceCriteriaSchema),
  }),
  activityDiagram: z.url(),
  references: z.object({
    businessRules: z.array(z.string()),
    dependencies: z.array(z.string()),
  }),
  nonFunctional: z.array(z.string()),
  outOfScope: z.array(z.string()),
});

export type Schema = z.infer<typeof schema>;
