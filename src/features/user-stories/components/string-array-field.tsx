import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldGroup,
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

export function StringArrayField({
  control,
  register,
  name,
  label,
  placeholder,
  sortable = false,
}: {
  control: Control<Schema>;
  register: UseFormRegister<Schema>;
  name: StringListName;
  label: string;
  placeholder?: string;
  sortable?: boolean;
}) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    // react-hook-form's useFieldArray requires object arrays; use casting for string arrays
    name: name as never,
  });
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
      `${label}: bước ${from + 1} đã chuyển đến vị trí ${to + 1}.`,
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
      {sortable && (
        <FieldDescription>
          Kéo tay nắm để đổi thứ tự, hoặc dùng nút mũi tên.
        </FieldDescription>
      )}
      <FieldGroup className="gap-1">
        {fields.map((f, idx) => (
          <div
            key={f.id}
            data-step-sort-item={f.id}
            className={cn(
              "flex items-center gap-1 transition-colors",
              sortable && draggedIndex === idx && "opacity-50",
              sortable &&
                dragOverIndex === idx &&
                draggedIndex !== idx &&
                "bg-primary/5 outline outline-1 outline-primary",
            )}
            onDragOver={(event) => {
              if (!sortable || draggedIndex === null) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDragOverIndex(idx);
            }}
            onDrop={(event) => {
              if (!sortable) return;
              event.preventDefault();
              event.stopPropagation();
              if (draggedIndex !== null) reorder(draggedIndex, idx);
            }}
          >
            {sortable && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                draggable
                className="shrink-0 cursor-grab active:cursor-grabbing"
                title="Kéo để đổi thứ tự"
                aria-label={`Kéo bước ${idx + 1} trong ${label.toLowerCase()} để đổi thứ tự`}
                onDragStart={(event) => startDrag(event, idx)}
                onDragEnd={resetDrag}
              >
                <GripVertical />
              </Button>
            )}
            <Input
              placeholder={placeholder}
              className="min-w-0 flex-1"
              {...register(`${name}.${idx}` as never)}
            />
            {sortable && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  title="Chuyển lên"
                  aria-label={`Chuyển bước ${idx + 1} trong ${label.toLowerCase()} lên`}
                  disabled={idx === 0}
                  onClick={() => reorder(idx, idx - 1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  title="Chuyển xuống"
                  aria-label={`Chuyển bước ${idx + 1} trong ${label.toLowerCase()} xuống`}
                  disabled={idx === fields.length - 1}
                  onClick={() => reorder(idx, idx + 1)}
                >
                  <ArrowDown />
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={() => remove(idx)}
              aria-label={`Xóa bước ${idx + 1} trong ${label.toLowerCase()}`}
            >
              <Trash2 />
            </Button>
          </div>
        ))}

        {sortable && (
          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>
        )}

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => append("" as never)}
          className="mt-2"
        >
          <Plus />
          Thêm
        </Button>
      </FieldGroup>
    </FieldSet>
  );
}
