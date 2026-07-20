import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import type { Control, UseFormRegister } from "react-hook-form";
import type { TddSchema } from "../validations";
import { TddStringArrayField } from "./tdd-string-array-field";

export function ReferencesSection({
  register,
  control,
}: {
  register: UseFormRegister<TddSchema>;
  control: Control<TddSchema>;
}) {
  return (
    <FieldSet>
      <FieldLegend>Tham chiếu</FieldLegend>
      <FieldGroup>
        <TddStringArrayField
          control={control}
          register={register}
          name="references.userStories"
          label="User Stories"
          placeholder="VD: HTM-142"
        />
        <TddStringArrayField
          control={control}
          register={register}
          name="references.businessRules"
          label="Business Rules"
          placeholder="VD: BR-03: đơn chỉ PAID khi signature hợp lệ"
        />
        <TddStringArrayField
          control={control}
          register={register}
          name="references.useCases"
          label="Use Cases"
          placeholder="VD: UC-05: Thanh toán đơn hàng"
        />
        <TddStringArrayField
          control={control}
          register={register}
          name="references.others"
          label="Khác"
          placeholder="VD: OpenAPI spec: repo/openapi.yaml"
        />
      </FieldGroup>
    </FieldSet>
  );
}
