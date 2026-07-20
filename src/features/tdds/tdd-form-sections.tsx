import { Plus, Trash2 } from "lucide-react";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller, useFieldArray } from "react-hook-form";

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
import {
  DocStatus,
  DocStatusLabel,
  HttpMethod,
  HttpMethodLabel,
  type TddSchema,
} from "./validations";

export type TddSectionProps = {
  register: UseFormRegister<TddSchema>;
  control: Control<TddSchema>;
  errors: FieldErrors<TddSchema>;
};

type StringArrayName =
  | "documentInfo.relatedStories"
  | "documentInfo.businessRules"
  | "contextGoals.goals"
  | "contextGoals.nonGoals"
  | "architecture.notes"
  | "sequenceDiagram.notes"
  | "activityDiagram.notes"
  | "stateDiagram.notes"
  | "dataModel.notes"
  | "externalApi.quirks"
  | "references.userStories"
  | "references.businessRules"
  | "references.useCases"
  | "references.others";

type DiagramName =
  | "architecture"
  | "sequenceDiagram"
  | "activityDiagram"
  | "stateDiagram"
  | "dataModel";

export function DocumentInfoSection({
  register,
  control,
  errors,
}: TddSectionProps) {
  return (
    <FieldSet>
      <FieldLegend>Thông tin tài liệu</FieldLegend>
      <FieldGroup>
        <Field data-invalid={!!errors.documentInfo?.docId || undefined}>
          <FieldLabel htmlFor="documentInfo.docId">Mã tài liệu</FieldLabel>
          <Input
            id="documentInfo.docId"
            placeholder="VD: TDD-BAOKIM-001"
            aria-invalid={!!errors.documentInfo?.docId || undefined}
            {...register("documentInfo.docId")}
          />
          {errors.documentInfo?.docId?.message && (
            <FieldError>{errors.documentInfo.docId.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.documentInfo?.feature || undefined}>
          <FieldLabel htmlFor="documentInfo.feature">Tính năng</FieldLabel>
          <Input
            id="documentInfo.feature"
            placeholder="VD: Tích hợp thanh toán Baokim"
            aria-invalid={!!errors.documentInfo?.feature || undefined}
            {...register("documentInfo.feature")}
          />
          {errors.documentInfo?.feature?.message && (
            <FieldError>{errors.documentInfo.feature.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.documentInfo?.author || undefined}>
          <FieldLabel htmlFor="documentInfo.author" className="gap-0.5">
            Tác giả
            <span className="text-muted-foreground">
              (tự động từ tên đăng nhập)
            </span>
          </FieldLabel>
          <Input
            id="documentInfo.author"
            readOnly
            tabIndex={-1}
            className="bg-muted/40 cursor-not-allowed"
            aria-invalid={!!errors.documentInfo?.author || undefined}
            {...register("documentInfo.author")}
          />
          {errors.documentInfo?.author?.message && (
            <FieldError>{errors.documentInfo.author.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.documentInfo?.reviewer || undefined}>
          <FieldLabel htmlFor="documentInfo.reviewer">Người review</FieldLabel>
          <Input
            id="documentInfo.reviewer"
            placeholder="VD: Tech Lead"
            aria-invalid={!!errors.documentInfo?.reviewer || undefined}
            {...register("documentInfo.reviewer")}
          />
          {errors.documentInfo?.reviewer?.message && (
            <FieldError>{errors.documentInfo.reviewer.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.documentInfo?.status || undefined}>
          <FieldLabel htmlFor="documentInfo.status">Trạng thái</FieldLabel>
          <Controller
            control={control}
            name="documentInfo.status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="documentInfo.status"
                  className="w-full"
                  aria-invalid={!!errors.documentInfo?.status || undefined}
                >
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DocStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {DocStatusLabel[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field data-invalid={!!errors.documentInfo?.version || undefined}>
          <FieldLabel htmlFor="documentInfo.version">Phiên bản</FieldLabel>
          <Input
            id="documentInfo.version"
            placeholder="VD: v1.0"
            aria-invalid={!!errors.documentInfo?.version || undefined}
            {...register("documentInfo.version")}
          />
          {errors.documentInfo?.version?.message && (
            <FieldError>{errors.documentInfo.version.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.documentInfo?.updatedAt || undefined}>
          <FieldLabel htmlFor="documentInfo.updatedAt">
            Cập nhật (YYYY-MM-DD)
          </FieldLabel>
          <Input
            id="documentInfo.updatedAt"
            type="date"
            aria-invalid={!!errors.documentInfo?.updatedAt || undefined}
            {...register("documentInfo.updatedAt")}
          />
          {errors.documentInfo?.updatedAt?.message && (
            <FieldError>{errors.documentInfo.updatedAt.message}</FieldError>
          )}
        </Field>

        <TddStringArrayField
          control={control}
          register={register}
          name="documentInfo.relatedStories"
          label="Story liên quan"
          placeholder="VD: HTM-142"
        />

        <TddStringArrayField
          control={control}
          register={register}
          name="documentInfo.businessRules"
          label="Business Rules"
          placeholder="VD: BR-03"
        />
      </FieldGroup>
    </FieldSet>
  );
}

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

export function ChangeLogSection({
  register,
  control,
  errors,
}: TddSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "changeLog",
  });

  return (
    <FieldSet>
      <FieldLegend>Lịch sử thay đổi</FieldLegend>
      <FieldGroup>
        {fields.map((f, idx) => (
          <div
            key={f.id}
            className="border border-border p-3 flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium">Mục #{idx + 1}</span>
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
            <div className="grid grid-cols-2 gap-2">
              <Field
                data-invalid={!!errors.changeLog?.[idx]?.date || undefined}
              >
                <FieldLabel htmlFor={`changeLog.${idx}.date`}>Ngày</FieldLabel>
                <Input
                  id={`changeLog.${idx}.date`}
                  type="date"
                  {...register(`changeLog.${idx}.date`)}
                />
              </Field>
              <Field
                data-invalid={!!errors.changeLog?.[idx]?.version || undefined}
              >
                <FieldLabel htmlFor={`changeLog.${idx}.version`}>
                  Phiên bản
                </FieldLabel>
                <Input
                  id={`changeLog.${idx}.version`}
                  placeholder="VD: v1.0"
                  {...register(`changeLog.${idx}.version`)}
                />
              </Field>
            </div>
            <Field
              data-invalid={!!errors.changeLog?.[idx]?.change || undefined}
            >
              <FieldLabel htmlFor={`changeLog.${idx}.change`}>
                Thay đổi
              </FieldLabel>
              <Textarea
                id={`changeLog.${idx}.change`}
                placeholder="VD: Tạo tài liệu"
                {...register(`changeLog.${idx}.change`)}
              />
            </Field>
            <Field
              data-invalid={!!errors.changeLog?.[idx]?.author || undefined}
            >
              <FieldLabel htmlFor={`changeLog.${idx}.author`}>
                Người thực hiện
              </FieldLabel>
              <Input
                id={`changeLog.${idx}.author`}
                placeholder="VD: Tân"
                {...register(`changeLog.${idx}.author`)}
              />
            </Field>
          </div>
        ))}
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() =>
            append({ date: "", version: "", change: "", author: "" })
          }
        >
          <Plus />
          Thêm mục lịch sử
        </Button>
      </FieldGroup>
    </FieldSet>
  );
}

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
