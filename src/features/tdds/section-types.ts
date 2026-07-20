import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import type { TddSchema } from "./validations";

export type TddSectionProps = {
  register: UseFormRegister<TddSchema>;
  control: Control<TddSchema>;
  errors: FieldErrors<TddSchema>;
};

export type StringArrayName =
  | "documentInfo.relatedStories"
  | "documentInfo.businessRules"
  | "contextGoals.goals"
  | "contextGoals.nonGoals"
  | "architecture.notes"
  | "sequenceDiagram.notes"
  | "activityDiagram.notes"
  | "stateDiagram.notes"
  | "dataModel.notes"
  | "externalApi.quirks"
  | "references.userStories"
  | "references.businessRules"
  | "references.useCases"
  | "references.others";

export type DiagramName =
  | "architecture"
  | "sequenceDiagram"
  | "activityDiagram"
  | "stateDiagram"
  | "dataModel";
