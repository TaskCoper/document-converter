import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumberSelect } from "@/features/projects/components/number-select";
import {
  DocumentLinkType,
  DocumentLinkTypeLabel,
} from "@/features/projects/document-types";
import { useEffect } from "react";
import type { Control, UseFormRegister } from "react-hook-form";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import type { TddSchema } from "../validations";

const LINK_TYPE_OPTIONS = Object.values(DocumentLinkType).map((t) => ({
  value: t,
  label: DocumentLinkTypeLabel[t],
}));

const KIND = { UserStory: 1, Tdd: 2, BusinessRule: 3, UseCase: 4 } as const;
const KIND_LABEL: Record<number, string> = {
  1: "Story",
  2: "TDD",
  3: "Rule",
  4: "Use Case",
};

const key = (kind: number, docKey: string) => `${kind} ${docKey}`;

/**
 * Loại cạnh + ghi chú cho từng liên kết của TDD.
 *
 * Vì sao là mảng riêng (`linkMeta`) chứ không nhét vào `references.*` như bên User Story:
 * `references.userStories/businessRules/useCases` của TDD là `string[]`, đổi sang object sẽ
 * kéo theo toMarkdown/fromMarkdown của TDD — tức là đổi định dạng Markdown, hợp đồng dùng
 * chung với nhánh GitHub. Mảng phụ này Markdown không biết tới nên không ảnh hưởng gì.
 *
 * Danh sách hàng bám theo lựa chọn ở các picker phía trên; cạnh TDD→TDD không có picker nào
 * nên luôn được giữ và vẫn sửa được loại/ghi chú ở đây.
 */
export function LinkMetaField({
  control,
  register,
}: {
  control: Control<TddSchema>;
  register: UseFormRegister<TddSchema>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "linkMeta",
  });
  const meta = useWatch({ control, name: "linkMeta" }) ?? [];
  const infoStories = useWatch({ control, name: "documentInfo.relatedStories" });
  const infoRules = useWatch({ control, name: "documentInfo.businessRules" });
  const refStories = useWatch({ control, name: "references.userStories" });
  const refRules = useWatch({ control, name: "references.businessRules" });
  const refUseCases = useWatch({ control, name: "references.useCases" });

  // Cùng quy tắc gộp mà saveTdd dùng: story/rule chọn được ở CẢ bước Thông tin lẫn bước Tham
  // chiếu, cả hai đọc từ cùng một bảng links nên phải hợp lại rồi khử trùng.
  const selected: { kind: number; docKey: string }[] = [
    ...new Set(
      [...(infoStories ?? []), ...(refStories ?? [])]
        .map((s) => s?.trim())
        .filter(Boolean),
    ),
  ]
    .map((docKey) => ({ kind: KIND.UserStory as number, docKey: docKey! }))
    .concat(
      [
        ...new Set(
          [...(infoRules ?? []), ...(refRules ?? [])]
            .map((s) => s?.trim())
            .filter(Boolean),
        ),
      ].map((docKey) => ({ kind: KIND.BusinessRule as number, docKey: docKey! })),
    )
    .concat(
      [...new Set((refUseCases ?? []).map((s) => s?.trim()).filter(Boolean))].map(
        (docKey) => ({ kind: KIND.UseCase as number, docKey: docKey! }),
      ),
    );

  // Đồng bộ linkMeta với lựa chọn hiện tại. Dep là chuỗi khoá đã sắp xếp chứ không phải mảng —
  // mảng đổi identity mỗi lần render, dùng thẳng sẽ chạy vô hạn.
  const selectedKey = selected
    .map((s) => key(s.kind, s.docKey))
    .sort()
    .join("|");
  const metaKey = meta
    .map((m) => key(m.targetKind, m.targetDocKey))
    .sort()
    .join("|");

  useEffect(() => {
    const have = new Set(meta.map((m) => key(m.targetKind, m.targetDocKey)));
    for (const s of selected) {
      if (!have.has(key(s.kind, s.docKey))) {
        append(
          {
            targetKind: s.kind,
            targetDocKey: s.docKey,
            linkType: DocumentLinkType.References,
            note: "",
          },
          { shouldFocus: false },
        );
      }
    }
    // Bỏ chọn ở picker thì hàng tương ứng phải biến mất — trừ cạnh TDD→TDD, thứ không có
    // picker nào để mà bỏ chọn.
    const wanted = new Set(selected.map((s) => key(s.kind, s.docKey)));
    for (let i = meta.length - 1; i >= 0; i--) {
      const m = meta[i];
      if (m.targetKind === KIND.Tdd) continue;
      if (!wanted.has(key(m.targetKind, m.targetDocKey))) remove(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, metaKey]);

  if (!fields.length) return null;

  return (
    <FieldSet>
      <FieldLegend variant="label">Loại liên kết & ghi chú</FieldLegend>
      <FieldGroup>
        {fields.map((f, idx) => {
          const m = meta[idx];
          if (!m) return null;
          return (
            <div
              key={f.id}
              className="flex flex-wrap items-center gap-2 border border-border p-2"
            >
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                {KIND_LABEL[m.targetKind] ?? m.targetKind}
              </span>
              <span className="font-mono text-xs font-medium">
                {m.targetDocKey}
              </span>
              <div className="w-44">
                <Controller
                  control={control}
                  name={`linkMeta.${idx}.linkType`}
                  render={({ field }) => (
                    <NumberSelect
                      value={field.value ?? DocumentLinkType.References}
                      onChange={field.onChange}
                      options={LINK_TYPE_OPTIONS}
                    />
                  )}
                />
              </div>
              <Input
                className="h-8 min-w-48 flex-1"
                placeholder="Ghi chú (không bắt buộc)"
                {...register(`linkMeta.${idx}.note`)}
              />
            </div>
          );
        })}
      </FieldGroup>
    </FieldSet>
  );
}
