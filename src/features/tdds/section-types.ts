import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import type { TddSchema } from "./validations";

export type TddSectionProps = {
  register: UseFormRegister<TddSchema>;
  control: Control<TddSchema>;
  errors: FieldErrors<TddSchema>;
  /**
   * Nguồn dữ liệu là backend (DB) chứ không phải Markdown trên GitHub.
   *
   * DB giữ được nhiều thứ hơn Markdown, nên ở chế độ này các section hiện thêm ô nhập cho
   * những field chỉ backend mới có (tên endpoint, ví dụ gắn theo endpoint, tiêu đề sơ đồ…).
   */
  backend?: boolean;
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
  | "assumptions"
  | "openQuestions"
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
