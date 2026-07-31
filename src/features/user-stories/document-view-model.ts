import type { Schema } from "./validations";

/**
 * Dữ liệu trình bày User Story.
 *
 * Kiểu này nới lỏng metadata so với form vì tài liệu backend có thể đang ở trạng thái
 * draft, chưa gán sprint hoặc chứa nhãn vai trò/trạng thái không thuộc enum của form.
 * Component trình bày chỉ hiển thị dữ liệu thật, không tự điền giá trị mặc định.
 */
export type StoryDocumentData = Omit<Schema, "metadata"> & {
  metadata: Omit<
    Schema["metadata"],
    "status" | "priority" | "sprint" | "assignee"
  > & {
    status: string;
    priority: string;
    sprint: number | null;
    assignee: { name: string; position: string }[];
  };
};

export interface StoryDocumentOptions {
  /**
   * Dựng URL cho một mục REFERENCES. `null` nghĩa là tài liệu đích chưa tồn tại,
   * khi đó renderer chỉ hiển thị mã tài liệu và không tạo liên kết chết.
   */
  linkHref?: (ref: { id: string; path: string }) => string | null;
}
