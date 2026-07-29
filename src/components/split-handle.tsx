import type { useSplitPane } from "@/hooks/use-split-pane";

/** Thanh kéo. Vạch mảnh khi rảnh, dày lên khi rê chuột vào để dễ trúng. */
export function SplitHandle(
  props: ReturnType<typeof useSplitPane>["handleProps"],
) {
  return (
    <div
      {...props}
      className="group hidden cursor-col-resize touch-none items-center justify-center focus-visible:outline-none lg:flex"
    >
      <div className="h-full w-px bg-border transition-colors group-hover:w-1 group-hover:bg-primary/60 group-focus-visible:w-1 group-focus-visible:bg-primary" />
    </div>
  );
}
