import type { useSplitPane } from "@/hooks/use-split-pane";
import { GripVertical } from "lucide-react";

/** Thanh kéo luôn hiện giữa viewport để người dùng nhận ra hai pane có thể thay đổi kích thước. */
export function SplitHandle(
  props: ReturnType<typeof useSplitPane>["handleProps"],
) {
  return (
    <div
      {...props}
      title="Kéo để đổi bề ngang · bấm đúp để đặt lại"
      className="group hidden w-3 cursor-col-resize touch-none items-start justify-center focus-visible:outline-none xl:flex"
    >
      <div className="sticky top-1/2 flex h-7 w-3 -translate-y-1/2 items-center justify-center border border-border bg-background text-muted-foreground group-hover:border-primary/60 group-hover:text-primary group-focus-visible:border-primary group-focus-visible:text-primary group-focus-visible:ring-1 group-focus-visible:ring-ring">
        <GripVertical aria-hidden="true" className="size-3" />
      </div>
    </div>
  );
}
