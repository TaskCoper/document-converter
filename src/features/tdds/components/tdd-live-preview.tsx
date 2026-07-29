import { useDebouncedWatch } from "@/hooks/use-debounced-watch";
import type { Control } from "react-hook-form";
import type { TddSchema } from "../validations";
import { TddDocumentView } from "./tdd-document-view";

// DocumentStatus của backend (dải 20-29) → DocStatus của TddSchema. Trùng bảng TDD_STATUS
// trong adapt-document, nên khung xem trước hiện đúng thứ trang chi tiết sẽ hiện.
const DOC_STATUS: Record<number, TddSchema["documentInfo"]["status"]> = {
  20: "Draft",
  21: "InReview",
  22: "Approved",
  23: "Approved",
};

/**
 * Xem trước TDD bằng CHÍNH `TddDocumentView` của trang chi tiết, dựng từ giá trị đang gõ.
 *
 * Trước đây trang sửa dùng TddPreviewPanel — một bộ render riêng dạng danh sách. Hai bộ render
 * tách rời nghĩa là thứ nhìn thấy lúc sửa không phải thứ sẽ thấy sau khi lưu, và mỗi lần đổi
 * bố cục ở một bên là bên kia lệch đi.
 */
export function TddLivePreview({
  control,
  status,
  notes,
}: {
  control: Control<TddSchema>;
  /** Trạng thái thật ở ô chọn "Thông tin tài liệu"; `documentInfo.status` chỉ là giữ chỗ. */
  status: number;
  /** documents.notes_md — trang chi tiết in nó ngay dưới nội dung, ở đây cũng vậy. */
  notes?: string;
}) {
  const data = useDebouncedWatch(control);

  const withStatus: Partial<TddSchema> = {
    ...data,
    documentInfo: data.documentInfo && {
      ...data.documentInfo,
      status: DOC_STATUS[status] ?? data.documentInfo.status,
    },
  };

  return (
    <div className="bg-white p-4">
      <TddDocumentView data={withStatus} />
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
