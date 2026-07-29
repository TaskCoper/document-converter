import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import type { Schema } from "./validations";

export type SectionProps = {
  register: UseFormRegister<Schema>;
  control: Control<Schema>;
  errors: FieldErrors<Schema>;
  /**
   * Nguồn dữ liệu là backend (DB) chứ không phải Markdown trên GitHub.
   *
   * DB giữ được nhiều thứ hơn Markdown, nên ở chế độ này các section hiện thêm ô nhập cho
   * những field chỉ backend mới có (tiêu đề luồng, loại liên kết, ghi chú liên kết...) và ẩn
   * những ô mà trang sửa của project đã có nơi khác (trạng thái).
   */
  backend?: boolean;
};

export type StringListName =
  | "conditions.preconditions"
  | "flow.mainFlow"
  | "nonFunctional"
  | "outOfScope"
  | "assumptions"
  | "openQuestions";
