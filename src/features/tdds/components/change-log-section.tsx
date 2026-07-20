import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import type { TddSectionProps } from "../section-types";

export function ChangeLogSection({
  register,
  control,
  errors,
}: TddSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "changeLog",
  });

  return (
    <FieldSet>
      <FieldLegend>Lịch sử thay đổi</FieldLegend>
      <FieldGroup>
        {fields.map((f, idx) => (
          <div
            key={f.id}
            className="border border-border p-3 flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium">Mục #{idx + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(idx)}
                aria-label="Xóa"
              >
                <Trash2 />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field
                data-invalid={!!errors.changeLog?.[idx]?.date || undefined}
              >
                <FieldLabel htmlFor={`changeLog.${idx}.date`}>Ngày</FieldLabel>
                <Input
                  id={`changeLog.${idx}.date`}
                  type="date"
                  {...register(`changeLog.${idx}.date`)}
                />
              </Field>
              <Field
                data-invalid={!!errors.changeLog?.[idx]?.version || undefined}
              >
                <FieldLabel htmlFor={`changeLog.${idx}.version`}>
                  Phiên bản
                </FieldLabel>
                <Input
                  id={`changeLog.${idx}.version`}
                  placeholder="VD: v1.0"
                  {...register(`changeLog.${idx}.version`)}
                />
              </Field>
            </div>
            <Field
              data-invalid={!!errors.changeLog?.[idx]?.change || undefined}
            >
              <FieldLabel htmlFor={`changeLog.${idx}.change`}>
                Thay đổi
              </FieldLabel>
              <Textarea
                id={`changeLog.${idx}.change`}
                placeholder="VD: Tạo tài liệu"
                {...register(`changeLog.${idx}.change`)}
              />
            </Field>
            <Field
              data-invalid={!!errors.changeLog?.[idx]?.author || undefined}
            >
              <FieldLabel htmlFor={`changeLog.${idx}.author`}>
                Người thực hiện
              </FieldLabel>
              <Input
                id={`changeLog.${idx}.author`}
                placeholder="VD: Tân"
                {...register(`changeLog.${idx}.author`)}
              />
            </Field>
          </div>
        ))}
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() =>
            append({ date: "", version: "", change: "", author: "" })
          }
        >
          <Plus />
          Thêm mục lịch sử
        </Button>
      </FieldGroup>
    </FieldSet>
  );
}
