import { useDebouncedWatch } from "@/hooks/use-debounced-watch";
import type { Control } from "react-hook-form";
import type { TddSchema } from "../validations";
import { TddDocumentView } from "./tdd-document-view";

/**
 * Xem trước TDD bằng CHÍNH `TddDocumentView` của trang chi tiết, dựng từ giá trị đang gõ.
 *
 * Trước đây trang sửa dùng TddPreviewPanel — một bộ render riêng dạng danh sách. Hai bộ render
 * tách rời nghĩa là thứ nhìn thấy lúc sửa không phải thứ sẽ thấy sau khi lưu, và mỗi lần đổi
 * bố cục ở một bên là bên kia lệch đi.
 */
export function TddLivePreview({
  control,
  notes,
}: {
  control: Control<TddSchema>;
  /** documents.notes_md — trang chi tiết in nó ngay dưới nội dung, ở đây cũng vậy. */
  notes?: string;
}) {
  const data = useDebouncedWatch(control);

  return (
    <div className="bg-white p-4">
      <TddDocumentView data={data} />
      {notes?.trim() && (
        <div className="mt-8 border-t border-gray-200 pt-4">
          <h3 className="mb-2 text-xs font-semibold text-primary">Ghi chú</h3>
          <pre className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-gray-800">
            {notes}
          </pre>
        </div>
      )}
    </div>
  );
}
