"use no memo";

import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { StoryDocumentData } from "../document-view-model";
import type { Schema } from "../validations";
import { StoryDocumentTable } from "./story-document-table";

/**
 * Xem trước bằng chính component React của trang chi tiết, dựng từ giá trị đang gõ trong form.
 * Không tạo chuỗi HTML hay iframe nên thay đổi form và thay đổi bề ngang panel chỉ cần React
 * cập nhật đúng các ô bị ảnh hưởng.
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

  const previewData = (() => {
    // Form đang gõ dở thì nhiều field còn thiếu. Renderer chỉ trình bày nên lấp đủ hình dạng
    // để preview vẫn hoạt động mà không ép giá trị giả vào form.
    const m = data.metadata;
    const mapReferences = (
      references:
        | {
            id?: string;
            path?: string;
            linkType?: number;
            note?: string;
          }[]
        | undefined,
    ) =>
      (references ?? []).map((reference) => ({
        id: reference.id ?? "",
        path: reference.path ?? "",
        linkType: reference.linkType,
        note: reference.note,
      }));
    const input: StoryDocumentData = {
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
        preconditions: data.conditions?.preconditions ?? [],
        trigger: data.conditions?.trigger ?? "",
      },
      flow: {
        mainFlow: data.flow?.mainFlow ?? [],
        mainFlowTitle: data.flow?.mainFlowTitle,
        alternativeFlow: (data.flow?.alternativeFlow ?? []).map((f) => ({
          code: f?.code ?? "",
          title: f?.title,
          steps: f?.steps ?? [],
        })),
        exceptionFlow: (data.flow?.exceptionFlow ?? []).map((f) => ({
          code: f?.code ?? "",
          title: f?.title,
          steps: f?.steps ?? [],
        })),
      },
      acceptanceCriteria: (data.acceptanceCriteria ?? []).map((ac) => ({
        code: ac?.code ?? "",
        criterias: (ac?.criterias ?? []).map((c) => ({
          type: c?.type ?? "Given",
          step: c?.step ?? "",
        })),
      })),
      references: {
        tdds: mapReferences(data.references?.tdds),
        rules: mapReferences(data.references?.rules),
        dependencies: mapReferences(data.references?.dependencies),
      },
      nonFunctional: data.nonFunctional ?? [],
      outOfScope: data.outOfScope ?? [],
      assumptions: data.assumptions,
      openQuestions: data.openQuestions,
    };
    return input;
  })();

  return <StoryDocumentTable data={previewData} linkHref={linkHref} />;
}
