import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray } from "react-hook-form";
import type { TddSectionProps } from "../section-types";
import { HttpMethod, HttpMethodLabel } from "../validations";

export function InternalApiSection({
  register,
  control,
  errors,
}: TddSectionProps) {
  const endpointsArr = useFieldArray({
    control,
    name: "internalApi.endpoints",
  });
  const examplesArr = useFieldArray({
    control,
    name: "internalApi.examples",
  });
  const errorCodesArr = useFieldArray({
    control,
    name: "internalApi.errorCodes",
  });

  return (
    <FieldSet>
      <FieldLegend>API Contract nội bộ</FieldLegend>
      <FieldGroup>
        <FieldSet>
          <FieldLegend variant="label">Endpoints</FieldLegend>
          <FieldGroup>
            {endpointsArr.fields.map((f, idx) => (
              <div key={f.id} className="flex gap-1 items-start">
                <div className="flex-1 grid grid-cols-[8rem_1fr] gap-2">
                  <Field>
                    <FieldLabel htmlFor={`internalApi.endpoints.${idx}.method`}>
                      Method
                    </FieldLabel>
                    <Controller
                      control={control}
                      name={`internalApi.endpoints.${idx}.method`}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            id={`internalApi.endpoints.${idx}.method`}
                            className="w-full"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(HttpMethod).map((m) => (
                              <SelectItem key={m} value={m}>
                                {HttpMethodLabel[m]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field
                    data-invalid={
                      !!errors.internalApi?.endpoints?.[idx]?.endpoint ||
                      undefined
                    }
                  >
                    <FieldLabel
                      htmlFor={`internalApi.endpoints.${idx}.endpoint`}
                    >
                      Endpoint
                    </FieldLabel>
                    <Input
                      id={`internalApi.endpoints.${idx}.endpoint`}
                      placeholder="VD: /payment/create"
                      {...register(`internalApi.endpoints.${idx}.endpoint`)}
                    />
                    {errors.internalApi?.endpoints?.[idx]?.endpoint
                      ?.message && (
                      <FieldError>
                        {errors.internalApi.endpoints[idx]?.endpoint?.message}
                      </FieldError>
                    )}
                  </Field>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => endpointsArr.remove(idx)}
                  aria-label="Xóa"
                  className="mt-6.5"
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            {endpointsArr.fields.map((f, idx) => (
              <Field
                key={`desc-${f.id}`}
                data-invalid={
                  !!errors.internalApi?.endpoints?.[idx]?.description ||
                  undefined
                }
              >
                <FieldLabel
                  htmlFor={`internalApi.endpoints.${idx}.description`}
                >
                  Mô tả endpoint #{idx + 1}
                </FieldLabel>
                <Input
                  id={`internalApi.endpoints.${idx}.description`}
                  placeholder="VD: Tạo payment request"
                  {...register(`internalApi.endpoints.${idx}.description`)}
                />
                {errors.internalApi?.endpoints?.[idx]?.description?.message && (
                  <FieldError>
                    {errors.internalApi.endpoints[idx]?.description?.message}
                  </FieldError>
                )}
              </Field>
            ))}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() =>
                endpointsArr.append({
                  endpoint: "",
                  method: HttpMethod.POST,
                  description: "",
                })
              }
            >
              <Plus />
              Thêm endpoint
            </Button>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend variant="label">Ví dụ Request/Response</FieldLegend>
          <FieldGroup>
            {examplesArr.fields.map((f, idx) => (
              <div
                key={f.id}
                className="border border-border p-3 flex flex-col gap-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">Ví dụ #{idx + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => examplesArr.remove(idx)}
                    aria-label="Xóa"
                  >
                    <Trash2 />
                  </Button>
                </div>
                <Field>
                  <FieldLabel htmlFor={`internalApi.examples.${idx}.title`}>
                    Tiêu đề
                  </FieldLabel>
                  <Input
                    id={`internalApi.examples.${idx}.title`}
                    placeholder="VD: POST /payment/create"
                    {...register(`internalApi.examples.${idx}.title`)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`internalApi.examples.${idx}.content`}>
                    Nội dung
                  </FieldLabel>
                  <Textarea
                    id={`internalApi.examples.${idx}.content`}
                    placeholder="Request: ..."
                    className="font-mono text-xs min-h-32"
                    {...register(`internalApi.examples.${idx}.content`)}
                  />
                </Field>
              </div>
            ))}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => examplesArr.append({ title: "", content: "" })}
            >
              <Plus />
              Thêm ví dụ
            </Button>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend variant="label">Mã lỗi</FieldLegend>
          <FieldGroup>
            {errorCodesArr.fields.map((f, idx) => (
              <div
                key={f.id}
                className="border border-border p-3 flex flex-col gap-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">Mã lỗi #{idx + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => errorCodesArr.remove(idx)}
                    aria-label="Xóa"
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-2">
                  <Field>
                    <FieldLabel htmlFor={`internalApi.errorCodes.${idx}.code`}>
                      Code
                    </FieldLabel>
                    <Input
                      id={`internalApi.errorCodes.${idx}.code`}
                      placeholder="VD: ORDER_NOT_PENDING"
                      {...register(`internalApi.errorCodes.${idx}.code`)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`internalApi.errorCodes.${idx}.http`}>
                      HTTP
                    </FieldLabel>
                    <Input
                      id={`internalApi.errorCodes.${idx}.http`}
                      placeholder="VD: 409"
                      {...register(`internalApi.errorCodes.${idx}.http`)}
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor={`internalApi.errorCodes.${idx}.when`}>
                    Khi nào xảy ra
                  </FieldLabel>
                  <Input
                    id={`internalApi.errorCodes.${idx}.when`}
                    placeholder="VD: Tạo payment cho đơn đã PAID"
                    {...register(`internalApi.errorCodes.${idx}.when`)}
                  />
                </Field>
              </div>
            ))}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() =>
                errorCodesArr.append({ code: "", http: "", when: "" })
              }
            >
              <Plus />
              Thêm mã lỗi
            </Button>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </FieldSet>
  );
}
