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
  CriteriaCondition,
  CriteriaConditionLabel,
  Position,
  PositionLabel,
  Priority,
  PriorityLabel,
  Status,
  StatusLabel,
  type Schema,
} from "@/validations";
import { Plus, Trash2 } from "lucide-react";

export type SectionProps = {
  register: UseFormRegister<Schema>;
  control: Control<Schema>;
  errors: FieldErrors<Schema>;
};

export type StringListName =
  | "conditions.preconditions"
  | "flow.mainFlow"
  | "references.businessRules"
  | "references.dependencies"
  | "nonFunctional"
  | "outOfScope";

export function MetadataSection({ register, control, errors }: SectionProps) {

  const { fields, append, remove } = useFieldArray({
    control,
    name: "metadata.assignee",
  });

  return (
    <FieldSet>
      <FieldLegend>Thông tin chung</FieldLegend>
      <FieldGroup>
        <Field data-invalid={!!errors.metadata?.id || undefined}>
          <FieldLabel htmlFor="metadata.id">ID</FieldLabel>
          <Input
            id="metadata.id"
            placeholder="VD: STORY-001"
            aria-invalid={!!errors.metadata?.id || undefined}
            {...register("metadata.id")}
          />
          {errors.metadata?.id?.message && (
            <FieldError>{errors.metadata.id.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.metadata?.story || undefined}>
          <FieldLabel htmlFor="metadata.story">User Story</FieldLabel>
          <Textarea
            id="metadata.story"
            placeholder="Là một [vai trò], tôi muốn..."
            aria-invalid={!!errors.metadata?.story || undefined}
            {...register("metadata.story")}
          />
          {errors.metadata?.story?.message && (
            <FieldError>{errors.metadata.story.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.metadata?.context || undefined}>
          <FieldLabel htmlFor="metadata.context">Ngữ cảnh</FieldLabel>
          <Textarea
            id="metadata.context"
            placeholder="Mô tả ngữ cảnh"
            aria-invalid={!!errors.metadata?.context || undefined}
            {...register("metadata.context")}
          />
          {errors.metadata?.context?.message && (
            <FieldError>{errors.metadata.context.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.metadata?.sprint || undefined}>
          <FieldLabel htmlFor="metadata.sprint">Sprint</FieldLabel>
          <Input
            id="metadata.sprint"
            type="number"
            min={1}
            aria-invalid={!!errors.metadata?.sprint || undefined}
            {...register("metadata.sprint", { valueAsNumber: true })}
          />
          {errors.metadata?.sprint?.message && (
            <FieldError>{errors.metadata.sprint.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.metadata?.priority || undefined}>
          <FieldLabel htmlFor="metadata.priority">Độ ưu tiên</FieldLabel>
          <Controller
            control={control}
            name="metadata.priority"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="metadata.priority"
                  className="w-full"
                  aria-invalid={!!errors.metadata?.priority || undefined}
                >
                  <SelectValue placeholder="Chọn độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Priority).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PriorityLabel[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field data-invalid={!!errors.metadata?.status || undefined}>
          <FieldLabel htmlFor="metadata.status">Trạng thái</FieldLabel>
          <Controller
            control={control}
            name="metadata.status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="metadata.status"
                  className="w-full"
                  aria-invalid={!!errors.metadata?.status || undefined}
                >
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Status).map((s) => (
                    <SelectItem key={s} value={s}>
                      {StatusLabel[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field data-invalid={!!errors.metadata?.creator || undefined}>
          <FieldLabel htmlFor="metadata.creator">Người tạo</FieldLabel>
          <Input
            id="metadata.creator"
            aria-invalid={!!errors.metadata?.creator || undefined}
            {...register("metadata.creator")}
          />
          {errors.metadata?.creator?.message && (
            <FieldError>{errors.metadata.creator.message}</FieldError>
          )}
        </Field>

        <FieldSet>
          <FieldLegend variant="label">Người phụ trách</FieldLegend>
          <FieldGroup>
            {fields.map((f, idx) => (
              <div key={f.id} className="flex gap-1 items-start">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Field
                    data-invalid={
                      !!errors.metadata?.assignee?.[idx]?.name || undefined
                    }
                  >
                    <FieldLabel htmlFor={`metadata.assignee.${idx}.name`}>
                      Tên
                    </FieldLabel>
                    <Input
                      id={`metadata.assignee.${idx}.name`}
                      placeholder="Tên"
                      aria-invalid={
                        !!errors.metadata?.assignee?.[idx]?.name || undefined
                      }
                      {...register(`metadata.assignee.${idx}.name`)}
                    />
                    {errors.metadata?.assignee?.[idx]?.name?.message && (
                      <FieldError>
                        {errors.metadata.assignee[idx]?.name?.message}
                      </FieldError>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`metadata.assignee.${idx}.position`}>
                      Vị trí
                    </FieldLabel>
                    <Controller
                      control={control}
                      name={`metadata.assignee.${idx}.position`}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            id={`metadata.assignee.${idx}.position`}
                            className="w-full"
                          >
                            <SelectValue placeholder="Vị trí" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(Position).map((p) => (
                              <SelectItem key={p} value={p}>
                                {PositionLabel[p]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(idx)}
                  aria-label="Xóa"
                  className="mt-6.5"
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => append({ name: "", position: Position.FE })}
            >
              <Plus />
              Thêm người phụ trách
            </Button>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </FieldSet>
  );
}

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

export function AcceptanceCriteriaSection({
  register,
  control,
  errors,
}: SectionProps) {

  const { fields, append, remove } = useFieldArray({
    control,
    name: "acceptanceCriteria.criterias",
  });

  return (
    <FieldSet>
      <FieldLegend>Tiêu chí chấp nhận</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="acceptanceCriteria.code">Mã</FieldLabel>
          <Input
            id="acceptanceCriteria.code"
            placeholder="VD: AC-01"
            {...register("acceptanceCriteria.code")}
          />
        </Field>
        <FieldSet>
          <FieldLegend variant="label">Tiêu chí</FieldLegend>
          <FieldGroup>
            {fields.map((f, idx) => (
              <div key={f.id} className="flex gap-1 items-start">
                <div className="flex-1 grid grid-cols-[8rem_1fr] gap-2">
                  <Field>
                    <FieldLabel
                      htmlFor={`acceptanceCriteria.criterias.${idx}.type`}
                    >
                      Loại
                    </FieldLabel>
                    <Controller
                      control={control}
                      name={`acceptanceCriteria.criterias.${idx}.type`}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            id={`acceptanceCriteria.criterias.${idx}.type`}
                            className="w-full"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(CriteriaCondition).map((c) => (
                              <SelectItem key={c} value={c}>
                                {CriteriaConditionLabel[c]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field
                    data-invalid={
                      !!errors.acceptanceCriteria?.criterias?.[idx]?.step ||
                      undefined
                    }
                  >
                    <FieldLabel
                      htmlFor={`acceptanceCriteria.criterias.${idx}.step`}
                    >
                      Nội dung
                    </FieldLabel>
                    <Input
                      id={`acceptanceCriteria.criterias.${idx}.step`}
                      {...register(`acceptanceCriteria.criterias.${idx}.step`)}
                    />
                  </Field>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(idx)}
                  aria-label="Xóa"
                  className="mt-6.5"
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() =>
                append({ type: CriteriaCondition.Given, step: "" })
              }
            >
              <Plus />
              Thêm tiêu chí
            </Button>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </FieldSet>
  );
}

export function ReferencesSection({
  register,
  control,
}: {
  register: UseFormRegister<Schema>;
  control: Control<Schema>;
}) {

  return (
    <FieldSet>
      <FieldLegend>Tham chiếu</FieldLegend>
      <FieldGroup>
        <StringArrayField
          control={control}
          register={register}
          name="references.businessRules"
          label="Quy tắc nghiệp vụ"
          placeholder="VD: BR-01"
        />
        <StringArrayField
          control={control}
          register={register}
          name="references.dependencies"
          label="Phụ thuộc"
          placeholder="VD: STORY-002"
        />
      </FieldGroup>
    </FieldSet>
  );
}

export function StringListSection({
  legend,
  description,
  name,
  control,
  register,
}: {
  legend: string;
  description?: string;
  name: "nonFunctional" | "outOfScope";
  control: Control<Schema>;
  register: UseFormRegister<Schema>;
}) {

  const { fields, append, remove } = useFieldArray({
    control,
    name: name as never,
  });

  return (
    <FieldSet>
      <FieldLegend>{legend}</FieldLegend>
      {description && (
        <p className="text-xs text-muted-foreground -mt-1">{description}</p>
      )}
      <FieldGroup className="gap-1">
        {fields.map((f, idx) => (
          <div key={f.id} className="flex gap-1 items-center">
            <Input {...register(`${name}.${idx}` as never)} />
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
          className="mt-2"
          size="sm"
          onClick={() => append("" as never)}
        >
          <Plus />
          Thêm
        </Button>
      </FieldGroup>
    </FieldSet>
  );
}

export function StringArrayField({
  control,
  register,
  name,
  label,
  placeholder,
}: {
  control: Control<Schema>;
  register: UseFormRegister<Schema>;
  name: StringListName;
  label: string;
  placeholder?: string;
}) {

  const { fields, append, remove } = useFieldArray({
    control,
    // react-hook-form's useFieldArray requires object arrays; use casting for string arrays
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
          onClick={() => append("" as never)}
          className="mt-2"
        >
          <Plus />
          Thêm
        </Button>
      </FieldGroup>
    </FieldSet>
  );
}

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
