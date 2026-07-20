import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
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
}: {
  control: Control<Schema>;
  register: UseFormRegister<Schema>;
  name: StringListName;
  label: string;
  placeholder?: string;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    // react-hook-form's useFieldArray requires object arrays; use casting for string arrays
    name: name as never,
  });

  return (
    <FieldSet>
      <FieldLegend variant="label">{label}</FieldLegend>
      <FieldGroup className="gap-1">
        {fields.map((f, idx) => (
          <div key={f.id} className="flex gap-1 items-center">
            <Input
              placeholder={placeholder}
              {...register(`${name}.${idx}` as never)}
            />
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
