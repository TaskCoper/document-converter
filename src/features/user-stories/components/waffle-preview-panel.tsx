import { StoryHtmlFrame } from "@/components/story-document-view";
import { useEffect, useMemo, useState } from "react";
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { toHtml, type HtmlInput } from "../exporters";
import type { Schema } from "../validations";

/**
 * Xem trước bằng CHÍNH bảng waffle của trang chi tiết, dựng từ giá trị đang gõ trong form.
 *
 * Trước đây trang sửa dùng PreviewPanel — một bộ render riêng dạng danh sách. Hai bộ render
 * tách rời nghĩa là thứ nhìn thấy lúc sửa không phải thứ sẽ thấy sau khi lưu, và mỗi lần đổi
 * bố cục ở một bên là bên kia lệch đi. Ở đây tái dùng đúng `toHtml` + `StoryHtmlFrame` mà
 * trang chi tiết dùng, nên hai màn hình không thể lệch nhau được nữa.
 */
export function WafflePreviewPanel({
  control,
  statusLabel,
  linkHref,
}: {
  control: Control<Schema>;
  /**
   * Nhãn trạng thái hiển thị thay cho `metadata.status` của form — nhánh backend lấy trạng
   * thái từ ô chọn riêng ở khối "Thông tin tài liệu", `metadata.status` chỉ là giá trị giữ chỗ.
   */
  statusLabel?: string;
  /** Dựng URL cho mục REFERENCES; xem HtmlOptions.linkHref. */
  linkHref?: (ref: { id: string; path: string }) => string | null;
}) {
  const data = useWatch({ control });

  // Dựng lại cả tài liệu HTML rồi ghi đè srcDoc của iframe là việc nặng; chạy theo từng phím
  // gõ sẽ giật. Trễ một nhịp ngắn cho người dùng gõ xong rồi mới vẽ.
  //
  // Debounce bám theo NỘI DUNG chứ không theo tham chiếu: useWatch trả về object mới ở mỗi
  // lần render, nên để `data` làm dependency thì timeout bị dựng lại liên tục — và vì
  // setSettled cũng gây render, nó thành vòng lặp tự nuôi, xem trước không bao giờ cập nhật.
  const key = JSON.stringify(data ?? {});
  const [settledKey, setSettledKey] = useState(key);
  useEffect(() => {
    const id = setTimeout(() => setSettledKey(key), 250);
    return () => clearTimeout(id);
  }, [key]);

  const html = useMemo(() => {
    const settled = JSON.parse(settledKey) as Partial<Schema>;
    // Form đang gõ dở thì nhiều field còn thiếu — toHtml chỉ in chuỗi, không validate, nên
    // chỉ cần lấp đủ hình dạng là vẽ được.
    const m = settled.metadata;
    const input: HtmlInput = {
      metadata: {
        id: m?.id ?? "",
        story: m?.story ?? "",
        context: m?.context ?? "",
        sprint: m?.sprint ?? null,
        priority: m?.priority ?? "",
        assignee: (m?.assignee ?? [])
          .filter((a) => a?.name?.trim() || a?.position)
          .map((a) => ({ name: a.name ?? "", position: a.position ?? "" })),
        creator: m?.creator ?? "",
        status: statusLabel ?? m?.status ?? "",
      },
      conditions: {
        preconditions: settled.conditions?.preconditions ?? [],
        trigger: settled.conditions?.trigger ?? "",
      },
      flow: {
        mainFlow: settled.flow?.mainFlow ?? [],
        mainFlowTitle: settled.flow?.mainFlowTitle,
        alternativeFlow: (settled.flow?.alternativeFlow ?? []).map((f) => ({
          code: f?.code ?? "",
          title: f?.title,
          steps: f?.steps ?? [],
        })),
        exceptionFlow: (settled.flow?.exceptionFlow ?? []).map((f) => ({
          code: f?.code ?? "",
          title: f?.title,
          steps: f?.steps ?? [],
        })),
      },
      acceptanceCriteria: (settled.acceptanceCriteria ?? []).map((ac) => ({
        code: ac?.code ?? "",
        criterias: (ac?.criterias ?? []).map((c) => ({
          type: c?.type ?? "Given",
          step: c?.step ?? "",
        })),
      })),
      references: {
        tdds: settled.references?.tdds ?? [],
        rules: settled.references?.rules ?? [],
        dependencies: settled.references?.dependencies ?? [],
      },
      nonFunctional: settled.nonFunctional ?? [],
      outOfScope: settled.outOfScope ?? [],
      assumptions: settled.assumptions,
      openQuestions: settled.openQuestions,
    };
    return toHtml(input, linkHref ? { linkHref } : undefined);
  }, [settledKey, statusLabel, linkHref]);

  return <StoryHtmlFrame html={html} title="Xem trước story" />;
}
