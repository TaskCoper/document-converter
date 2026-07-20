import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import type { TddSectionProps } from "../section-types";
import { TddStringArrayField } from "./tdd-string-array-field";

export function ExternalApiSection({
  register,
  control,
  errors,
}: TddSectionProps) {
  const endpointsArr = useFieldArray({
    control,
    name: "externalApi.endpoints",
  });
  const fieldsArr = useFieldArray({
    control,
    name: "externalApi.fields",
  });

  return (
    <FieldSet>
      <FieldLegend>API Contract bên ngoài</FieldLegend>
      <FieldGroup>
        <FieldSet>
          <FieldLegend variant="label">Endpoints sử dụng</FieldLegend>
          <FieldGroup>
            {endpointsArr.fields.map((f, idx) => (
              <div
                key={f.id}
                className="border border-border p-3 flex flex-col gap-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">
                    Endpoint #{idx + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => endpointsArr.remove(idx)}
                    aria-label="Xóa"
                  >
                    <Trash2 />
                  </Button>
                </div>
                <Field
                  data-invalid={
                    !!errors.externalApi?.endpoints?.[idx]?.endpoint ||
                    undefined
                  }
                >
                  <FieldLabel htmlFor={`externalApi.endpoints.${idx}.endpoint`}>
                    Endpoint
                  </FieldLabel>
                  <Input
                    id={`externalApi.endpoints.${idx}.endpoint`}
                    placeholder="VD: Baokim create order"
                    {...register(`externalApi.endpoints.${idx}.endpoint`)}
                  />
                </Field>
                <Field
                  data-invalid={
                    !!errors.externalApi?.endpoints?.[idx]?.purpose || undefined
                  }
                >
                  <FieldLabel htmlFor={`externalApi.endpoints.${idx}.purpose`}>
                    Mục đích
                  </FieldLabel>
                  <Input
                    id={`externalApi.endpoints.${idx}.purpose`}
                    placeholder="VD: Tạo giao dịch"
                    {...register(`externalApi.endpoints.${idx}.purpose`)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`externalApi.endpoints.${idx}.note`}>
                    Ghi chú
                  </FieldLabel>
                  <Input
                    id={`externalApi.endpoints.${idx}.note`}
                    placeholder="VD: cần JWT còn hạn"
                    {...register(`externalApi.endpoints.${idx}.note`)}
                  />
                </Field>
              </div>
            ))}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() =>
                endpointsArr.append({ endpoint: "", purpose: "", note: "" })
              }
            >
              <Plus />
              Thêm endpoint
            </Button>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend variant="label">Field quan trọng</FieldLegend>
          <FieldGroup>
            {fieldsArr.fields.map((f, idx) => (
              <div
                key={f.id}
                className="border border-border p-3 flex flex-col gap-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">Field #{idx + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => fieldsArr.remove(idx)}
                    aria-label="Xóa"
                  >
                    <Trash2 />
                  </Button>
                </div>
                <Field
                  data-invalid={
                    !!errors.externalApi?.fields?.[idx]?.field || undefined
                  }
                >
                  <FieldLabel htmlFor={`externalApi.fields.${idx}.field`}>
                    Field
                  </FieldLabel>
                  <Input
                    id={`externalApi.fields.${idx}.field`}
                    placeholder="VD: signature"
                    {...register(`externalApi.fields.${idx}.field`)}
                  />
                </Field>
                <Field
                  data-invalid={
                    !!errors.externalApi?.fields?.[idx]?.meaning || undefined
                  }
                >
                  <FieldLabel htmlFor={`externalApi.fields.${idx}.meaning`}>
                    Ý nghĩa
                  </FieldLabel>
                  <Input
                    id={`externalApi.fields.${idx}.meaning`}
                    placeholder="VD: Chữ ký HMAC"
                    {...register(`externalApi.fields.${idx}.meaning`)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`externalApi.fields.${idx}.note`}>
                    Ghi chú
                  </FieldLabel>
                  <Input
                    id={`externalApi.fields.${idx}.note`}
                    placeholder="VD: verify bắt buộc"
                    {...register(`externalApi.fields.${idx}.note`)}
                  />
                </Field>
              </div>
            ))}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() =>
                fieldsArr.append({ field: "", meaning: "", note: "" })
              }
            >
              <Plus />
              Thêm field
            </Button>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <Field>
          <FieldLabel htmlFor="externalApi.errorHandling">
            Xử lý lỗi từ đối tác
          </FieldLabel>
          <Textarea
            id="externalApi.errorHandling"
            placeholder="Ghi các mã lỗi/response bất thường của đối tác và cách mình xử lý"
            {...register("externalApi.errorHandling")}
          />
        </Field>

        <TddStringArrayField
          control={control}
          register={register}
          name="externalApi.quirks"
          label="Quirks / cạm bẫy"
          placeholder="VD: Nhanh.vn: filter parentId không chạy server-side"
        />
      </FieldGroup>
    </FieldSet>
  );
}
