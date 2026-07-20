import { FieldGroup, FieldLegend, FieldSeparator, FieldSet } from "@/components/ui/field";
import type { SectionProps } from "../section-types";
import { OtherFlowArrayField } from "./other-flow-array-field";
import { StringArrayField } from "./string-array-field";

export function FlowSection({ register, control }: SectionProps) {
  return (
    <FieldSet>
      <FieldLegend>Luồng xử lý</FieldLegend>
      <FieldGroup>
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
        />
        <FieldSeparator />
        <OtherFlowArrayField
          control={control}
          register={register}
          name="flow.exceptionFlow"
          label="Luồng ngoại lệ"
        />
      </FieldGroup>
    </FieldSet>
  );
}
