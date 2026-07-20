import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { Control, UseFormRegister } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import type { Schema } from "../validations";

export function StringListSection({
  legend,
  description,
  name,
  control,
  register,
}: {
  legend: string;
  description?: string;
  name: "nonFunctional" | "outOfScope";
  control: Control<Schema>;
  register: UseFormRegister<Schema>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as never,
  });

  return (
    <FieldSet>
      <FieldLegend>{legend}</FieldLegend>
      {description && (
        <p className="text-xs text-muted-foreground -mt-1">{description}</p>
      )}
      <FieldGroup className="gap-1">
        {fields.map((f, idx) => (
          <div key={f.id} className="flex gap-1 items-center">
            <Input {...register(`${name}.${idx}` as never)} />
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
        ))}
        <Button
          type="button"
          variant="default"
          className="mt-2"
          size="sm"
          onClick={() => append("" as never)}
        >
          <Plus />
          Thêm
        </Button>
      </FieldGroup>
    </FieldSet>
  );
}
