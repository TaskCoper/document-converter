import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { TddSectionProps } from "../section-types";
import { TddStringArrayField } from "./tdd-string-array-field";

export function ContextGoalsSection({
  register,
  control,
  errors,
}: TddSectionProps) {
  return (
    <FieldSet>
      <FieldLegend>Bối cảnh & Mục tiêu</FieldLegend>
      <FieldGroup>
        <Field data-invalid={!!errors.contextGoals?.problem || undefined}>
          <FieldLabel htmlFor="contextGoals.problem">Vấn đề</FieldLabel>
          <Textarea
            id="contextGoals.problem"
            placeholder="Mô tả ngắn vì sao cần thiết kế này"
            aria-invalid={!!errors.contextGoals?.problem || undefined}
            {...register("contextGoals.problem")}
          />
          {errors.contextGoals?.problem?.message && (
            <FieldError>{errors.contextGoals.problem.message}</FieldError>
          )}
        </Field>

        <TddStringArrayField
          control={control}
          register={register}
          name="contextGoals.goals"
          label="Mục tiêu"
          placeholder="VD: Khách thanh toán qua Baokim, hệ thống tự xác nhận"
        />

        <TddStringArrayField
          control={control}
          register={register}
          name="contextGoals.nonGoals"
          label="Ngoài phạm vi"
          placeholder="VD: Hoàn tiền (refund)"
        />
      </FieldGroup>
    </FieldSet>
  );
}
