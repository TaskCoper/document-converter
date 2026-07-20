import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { Control, UseFormRegister } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import type { StringArrayName } from "../section-types";
import type { TddSchema } from "../validations";

export function TddStringArrayField({
  control,
  register,
  name,
  label,
  placeholder,
}: {
  control: Control<TddSchema>;
  register: UseFormRegister<TddSchema>;
  name: StringArrayName;
  label: string;
  placeholder?: string;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
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
          className="mt-2"
          onClick={() => append("" as never)}
        >
          <Plus />
          Thêm
        </Button>
      </FieldGroup>
    </FieldSet>
  );
}
