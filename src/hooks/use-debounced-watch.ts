import { useEffect, useMemo, useState } from "react";
import type { Control, FieldValues } from "react-hook-form";
import { useWatch } from "react-hook-form";

/**
 * Giá trị form dùng cho khung xem trước, đã trễ một nhịp.
 *
 * Vẽ lại cả tài liệu theo từng phím gõ là việc nặng — nặng nhất là sơ đồ Mermaid: gõ dở
 * "flowchart T" là cú pháp sai, khung xem trước sẽ nhấp nháy khối báo lỗi ở mỗi ký tự.
 *
 * Dependency là chuỗi NỘI DUNG chứ không phải object useWatch trả về: object đó mang tham
 * chiếu mới ở mỗi lần render, để nó làm dependency thì timeout bị dựng lại liên tục — và vì
 * setState cũng gây render, nó thành vòng lặp tự nuôi, xem trước không bao giờ cập nhật.
 */
export function useDebouncedWatch<T extends FieldValues>(
  control: Control<T>,
  delayMs = 300,
): Partial<T> {
  const live = useWatch({ control });
  const key = JSON.stringify(live ?? {});
  const [settledKey, setSettledKey] = useState(key);

  useEffect(() => {
    const id = setTimeout(() => setSettledKey(key), delayMs);
    return () => clearTimeout(id);
  }, [key, delayMs]);

  return useMemo(() => JSON.parse(settledKey) as Partial<T>, [settledKey]);
}
