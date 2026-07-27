import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { SectionProps } from "../section-types";
import { OtherFlowArrayField } from "./other-flow-array-field";
import { StringArrayField } from "./string-array-field";

export function FlowSection({ register, control, backend }: SectionProps) {
  return (
    <FieldSet>
      <FieldLegend>Luồng xử lý</FieldLegend>
      <FieldGroup>
        {backend && (
          <Field>
            <FieldLabel htmlFor="flow.mainFlowTitle">
              Tiêu đề luồng chính
            </FieldLabel>
            <Input
              id="flow.mainFlowTitle"
              placeholder="VD: Đặt gói combo và áp mã thành công"
              {...register("flow.mainFlowTitle")}
            />
          </Field>
        )}
        <StringArrayField
          control={control}
          register={register}
          name="flow.mainFlow"
          label="Luồng chính"
          placeholder="Bước..."
        />
        <FieldSeparator />
        <OtherFlowArrayField
          control={control}
          register={register}
          name="flow.alternativeFlow"
          label="Luồng thay thế"
          backend={backend}
        />
        <FieldSeparator />
        <OtherFlowArrayField
          control={control}
          register={register}
          name="flow.exceptionFlow"
          label="Luồng ngoại lệ"
          backend={backend}
        />
      </FieldGroup>
    </FieldSet>
  );
}
