import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState, type DragEvent } from "react";
import type { Control, UseFormRegister } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import type { StringListName } from "../section-types";
import type { Schema } from "../validations";
import { StringArrayField } from "./string-array-field";

export function OtherFlowArrayField({
  control,
  register,
  name,
  label,
  backend,
}: {
  control: Control<Schema>;
  register: UseFormRegister<Schema>;
  name: "flow.alternativeFlow" | "flow.exceptionFlow";
  label: string;
  /** Backend lưu tiêu đề luồng riêng với mã (document_flows.title). Markdown thì không. */
  backend?: boolean;
}) {
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const resetDrag = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const reorder = (from: number, to: number) => {
    if (from === to) {
      resetDrag();
      return;
    }

    move(from, to);
    setAnnouncement(
      `${label} #${from + 1} đã chuyển đến vị trí ${to + 1}.`,
    );
    resetDrag();
  };

  const startDrag = (event: DragEvent<HTMLButtonElement>, index: number) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", fields[index].id);
    setDraggedIndex(index);
    setDragOverIndex(index);
  };

  return (
    <FieldSet>
      <FieldLegend variant="label">{label}</FieldLegend>
      <FieldDescription>
        Kéo tay nắm để đổi thứ tự, hoặc dùng nút mũi tên.
      </FieldDescription>
      <FieldGroup>
        {fields.length === 0 && (
          <p className="border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            Chưa có {label.toLowerCase()} nào.
          </p>
        )}
        {fields.map((f, idx) => (
          <div
            key={f.id}
            data-flow-sort-item={f.id}
            className={cn(
              "flex flex-col gap-3 border border-border p-3 transition-colors",
              draggedIndex === idx && "opacity-50",
              dragOverIndex === idx &&
                draggedIndex !== idx &&
                "border-primary bg-primary/5",
            )}
            onDragOver={(event) => {
              if (draggedIndex === null) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDragOverIndex(idx);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (draggedIndex !== null) reorder(draggedIndex, idx);
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  draggable
                  className="cursor-grab active:cursor-grabbing"
                  title="Kéo để đổi thứ tự"
                  aria-label={`Kéo ${label.toLowerCase()} #${idx + 1} để đổi thứ tự`}
                  onDragStart={(event) => startDrag(event, idx)}
                  onDragEnd={resetDrag}
                >
                  <GripVertical />
                </Button>
                <span className="truncate text-xs font-medium">
                  {label} #{idx + 1}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Chuyển lên"
                  aria-label={`Chuyển ${label.toLowerCase()} #${idx + 1} lên`}
                  disabled={idx === 0}
                  onClick={() => reorder(idx, idx - 1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Chuyển xuống"
                  aria-label={`Chuyển ${label.toLowerCase()} #${idx + 1} xuống`}
                  disabled={idx === fields.length - 1}
                  onClick={() => reorder(idx, idx + 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Xoá"
                  aria-label={`Xoá ${label.toLowerCase()} #${idx + 1}`}
                  onClick={() => remove(idx)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            <div className={backend ? "grid grid-cols-2 gap-3" : undefined}>
              <Field>
                <FieldLabel htmlFor={`${name}.${idx}.code`}>Mã</FieldLabel>
                <Input
                  id={`${name}.${idx}.code`}
                  placeholder="VD: ALT-01"
                  {...register(`${name}.${idx}.code`)}
                />
              </Field>
              {backend && (
                <Field>
                  <FieldLabel htmlFor={`${name}.${idx}.title`}>
                    Tiêu đề
                  </FieldLabel>
                  <Input
                    id={`${name}.${idx}.title`}
                    placeholder="VD: Khách đổi mã giảm giá khác"
                    {...register(`${name}.${idx}.title`)}
                  />
                </Field>
              )}
            </div>
            <StringArrayField
              control={control}
              register={register}
              name={`${name}.${idx}.steps` as StringListName}
              label="Các bước"
              placeholder="Bước..."
              sortable
            />
          </div>
        ))}
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => append({ code: "", title: "", steps: [""] })}
        >
          <Plus /> Thêm {label.toLowerCase()}
        </Button>
      </FieldGroup>
    </FieldSet>
  );
}
