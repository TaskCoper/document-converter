import { useDebouncedWatch } from "@/hooks/use-debounced-watch";
import type { Control } from "react-hook-form";
import type { RuleSchema } from "../validations";
import { RuleDocumentView } from "./rule-document-view";

// DocumentStatus của backend (dải 30-39) → status của RuleSchema. Trùng bảng RULE_STATUS
// trong adapt-document.
const DOC_STATUS: Record<number, RuleSchema["status"]> = {
  30: "Draft",
  31: "Active",
  32: "Deprecated",
};

/** Xem trước Business Rule bằng CHÍNH RuleDocumentView của trang chi tiết. */
export function RuleLivePreview({
  control,
  status,
  notes,
}: {
  control: Control<RuleSchema>;
  status: number;
  notes?: string;
}) {
  const data = useDebouncedWatch(control);

  return (
    <div className="bg-white p-4">
      <RuleDocumentView
        data={{ ...data, status: DOC_STATUS[status] ?? data.status }}
      />
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
