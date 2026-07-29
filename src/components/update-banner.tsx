import { Button } from "@/components/ui/button";
import { applyUpdate, useUpdatePending } from "@/lib/app-version";
import { RefreshCwIcon, XIcon } from "lucide-react";
import { useState } from "react";

/**
 * Thanh báo "đã có phiên bản mới". Đóng banner chỉ ẩn thông báo — trạng thái chờ cập
 * nhật vẫn còn, nên lần đổi route kế tiếp trang vẫn tự tải lại (xem main.tsx).
 */
export function UpdateBanner() {
  const pending = useUpdatePending();
  const [dismissed, setDismissed] = useState(false);

  if (!pending || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 sm:inset-x-auto sm:right-3 sm:justify-end">
      <div className="flex items-center gap-3 border border-border bg-background px-3 py-2 text-xs shadow-lg">
        <RefreshCwIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span>Đã có phiên bản mới của ứng dụng.</span>
        <Button size="sm" onClick={applyUpdate}>
          Tải lại ngay
        </Button>
        <button
          type="button"
          aria-label="Đóng"
          className="text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setDismissed(true)}
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
