import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { DiagramName, StringArrayName, TddSectionProps } from "../section-types";
import { TddStringArrayField } from "./tdd-string-array-field";

export function DiagramSection({
  register,
  control,
  errors,
  name,
  legend,
  description,
}: TddSectionProps & {
  name: DiagramName;
  legend: string;
  description?: string;
}) {
  return (
    <FieldSet>
      <FieldLegend>{legend}</FieldLegend>
      {description && (
        <p className="text-xs text-muted-foreground -mt-1">{description}</p>
      )}
      <FieldGroup>
        <Field data-invalid={!!errors[name]?.description || undefined}>
          <FieldLabel htmlFor={`${name}.description`}>Mô tả</FieldLabel>
          <Textarea
            id={`${name}.description`}
            placeholder="Mô tả sơ đồ"
            {...register(`${name}.description`)}
          />
        </Field>
        <Field data-invalid={!!errors[name]?.mermaid || undefined}>
          <FieldLabel htmlFor={`${name}.mermaid`}>Mermaid</FieldLabel>
          <Textarea
            id={`${name}.mermaid`}
            placeholder="flowchart LR&#10;    A --> B"
            {...register(`${name}.mermaid`)}
          />
        </Field>
        <TddStringArrayField
          control={control}
          register={register}
          name={`${name}.notes` as StringArrayName}
          label="Ghi chú"
          placeholder="VD: Điểm cần lưu ý"
        />
      </FieldGroup>
    </FieldSet>
  );
}
