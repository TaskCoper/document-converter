import { useCallback, useEffect, useRef, useState } from "react";

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Chừa lại cho cột trái — form phải còn đủ rộng để nhập liệu. */
const MIN_LEFT = 420;

/** Khớp với bề ngang thật của SplitHandle. */
const HANDLE_WIDTH = 12;

/**
 * Kéo để đổi bề ngang panel bên phải của bố cục "form | xem trước".
 *
 * Trả về `style` mang biến CSS thay vì `gridTemplateColumns` dựng sẵn: bố cục chỉ chia hai cột
 * từ breakpoint xl trở lên, dưới đó là một cột xếp dọc. Đặt gridTemplateColumns thẳng bằng
 * inline style sẽ đè luôn cả phần responsive đó, nên biến CSS + lớp `xl:` của Tailwind mới giữ
 * được hành vi trên màn hình hẹp.
 *
 * Bề ngang lưu vào localStorage theo `storageKey`: người dùng chỉnh một lần là dùng mãi, không
 * phải kéo lại mỗi lần mở tài liệu khác.
 */
export function useSplitPane({
  storageKey,
  initial,
  min = 360,
  max = 1400,
}: {
  storageKey: string;
  initial: number;
  min?: number;
  max?: number;
}) {
  const [width, setWidth] = useState(() => {
    const saved = Number(localStorage.getItem(storageKey));
    return Number.isFinite(saved) && saved > 0 ? clamp(saved, min, max) : initial;
  });

  // Giữ phần tử DOM trong STATE chứ không phải ref: hook này trả kết quả ra ngoài, mà đọc
  // một ref giữa lúc render là thứ React không bảo đảm (và react-hooks/refs chặn đúng chỗ đó).
  // setContainer là setter của useState nên truyền thẳng vào thuộc tính ref được.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // Đang kéo hay không là ref chứ KHÔNG phải state: setState ở pointerdown chưa chắc flush
  // xong trước pointermove đầu tiên (hai sự kiện có thể rơi vào cùng một task), lúc đó handler
  // vẫn đọc ra false và cú kéo trôi mất. Giá trị này cũng không dùng để render.
  const dragging = useRef(false);

  const resize = useCallback(
    (clientX: number) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const cs = getComputedStyle(container);
      const padLeft = parseFloat(cs.paddingLeft) || 0;
      const padRight = parseFloat(cs.paddingRight) || 0;
      const gap = parseFloat(cs.columnGap) || 0;

      // Giá trị đặt vào grid là bề ngang CỘT, nên phải trừ hết phần không thuộc cột: padding
      // hai bên, hai khe gap và chính thanh kéo. Lấy thẳng (mép phải − con trỏ) sẽ nống lên
      // chừng 50px, và MIN_LEFT không còn được tôn trọng — cột form co xuống dưới mức tối thiểu.
      const columns = rect.width - padLeft - padRight - 2 * gap - HANDLE_WIDTH;
      const room = Math.max(min, columns - MIN_LEFT);
      const fromPointer = rect.right - padRight - gap - clientX;
      setWidth(clamp(fromPointer, min, Math.min(max, room)));
    },
    [container, min, max],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || e.button !== 0) return;
    e.preventDefault();
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    // Không có hai dòng này thì con trỏ nhảy loạn và text bị bôi đen khi kéo qua vùng chữ.
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const stopDragging = () => {
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;

    // Pointer capture có thể bị mất mà không nhận được pointerup (đổi tab, browser/tool
    // kết thúc gesture, HMR...). Khi đó lần hover kế tiếp có buttons=0; tuyệt đối không được
    // hiểu hover là kéo và tự thay đổi bề ngang preview.
    if ((e.buttons & 1) === 0) {
      stopDragging();
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      return;
    }

    resize(e.clientX);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    stopDragging();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // Bàn phím: thanh chia là một control thật sự, không chỉ để chuột dùng.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 64 : 16;
    if (e.key === "ArrowLeft") setWidth((w) => clamp(w + step, min, max));
    else if (e.key === "ArrowRight") setWidth((w) => clamp(w - step, min, max));
    else if (e.key === "Home") setWidth(initial);
    else if (e.key === "End") setWidth(min);
    else return;
    e.preventDefault();
  };

  useEffect(() => {
    localStorage.setItem(storageKey, String(Math.round(width)));
  }, [storageKey, width]);

  return {
    setContainer,
    style: { "--pane-w": `${Math.round(width)}px` } as React.CSSProperties,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onLostPointerCapture: stopDragging,
      onKeyDown,
      // Bấm đúp để trả về bề ngang mặc định — nhanh hơn kéo mò.
      onDoubleClick: () => setWidth(initial),
      role: "separator" as const,
      "aria-orientation": "vertical" as const,
      "aria-label": "Kéo để đổi bề ngang khung xem trước",
      "aria-valuenow": Math.round(width),
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-valuetext": `Khung xem trước rộng ${Math.round(width)} pixel`,
      tabIndex: 0,
    },
  };
}
