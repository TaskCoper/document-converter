import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
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
}: {
  control: Control<Schema>;
  register: UseFormRegister<Schema>;
  name: "flow.alternativeFlow" | "flow.exceptionFlow";
  label: string;
}) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <FieldSet>
      <FieldLegend variant="label">{label}</FieldLegend>
      <FieldGroup>
        {fields.map((f, idx) => (
          <div
            key={f.id}
            className="border border-border p-3 flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium">
                {label} #{idx + 1}
              </span>
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
            <Field>
              <FieldLabel htmlFor={`${name}.${idx}.code`}>Mã</FieldLabel>
              <Input
                id={`${name}.${idx}.code`}
                placeholder="VD: ALT-01"
                {...register(`${name}.${idx}.code`)}
              />
            </Field>
            <StringArrayField
              control={control}
              register={register}
              name={`${name}.${idx}.steps` as StringListName}
              label="Các bước"
              placeholder="Bước..."
            />
          </div>
        ))}
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => append({ code: "", steps: [""] })}
        >
          <Plus /> Thêm {label.toLowerCase()}
        </Button>
      </FieldGroup>
    </FieldSet>
  );
}
