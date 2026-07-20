import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { SectionProps } from "../section-types";
import { StringArrayField } from "./string-array-field";

export function ConditionsSection({ register, control, errors }: SectionProps) {
  return (
    <FieldSet>
      <FieldLegend>Điều kiện</FieldLegend>
      <FieldGroup>
        <StringArrayField
          control={control}
          register={register}
          name="conditions.preconditions"
          label="Điều kiện tiên quyết"
          placeholder="VD: Người dùng đã đăng nhập"
        />
        <Field data-invalid={!!errors.conditions?.trigger || undefined}>
          <FieldLabel htmlFor="conditions.trigger">Kích hoạt</FieldLabel>
          <Textarea
            id="conditions.trigger"
            placeholder="Sự kiện kích hoạt luồng"
            {...register("conditions.trigger")}
          />
          {errors.conditions?.trigger?.message && (
            <FieldError>{errors.conditions.trigger.message}</FieldError>
          )}
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
