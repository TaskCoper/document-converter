import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
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
import { Plus, Trash2 } from "lucide-react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller, useFieldArray } from "react-hook-form";
import type { SectionProps } from "../section-types";
import {
  CriteriaCondition,
  CriteriaConditionLabel,
  type Schema,
} from "../validations";

export function AcceptanceCriteriaSection({ control, errors }: SectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "acceptanceCriteria",
  });

  return (
    <FieldSet>
      <FieldLegend>Tiêu chí chấp nhận</FieldLegend>
      <FieldGroup>
        {fields.map((f, idx) => (
          <AcGroupField
            key={f.id}
            idx={idx}
            control={control}
            errors={errors}
            onRemove={() => remove(idx)}
          />
        ))}
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() =>
            append({
              code: "",
              criterias: [{ type: CriteriaCondition.Given, step: "" }],
            })
          }
        >
          <Plus />
          Thêm tiêu chí
        </Button>
      </FieldGroup>
    </FieldSet>
  );
}

function AcGroupField({
  idx,
  control,
  errors,
  onRemove,
}: {
  idx: number;
  control: Control<Schema>;
  errors: FieldErrors<Schema>;
  onRemove: () => void;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `acceptanceCriteria.${idx}.criterias`,
  });

  return (
    <div className="border border-border p-3 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium">Tiêu chí #{idx + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Xóa"
        >
          <Trash2 />
        </Button>
      </div>
      <Field>
        <FieldLabel htmlFor={`acceptanceCriteria.${idx}.code`}>Mã</FieldLabel>
        <Controller
          control={control}
          name={`acceptanceCriteria.${idx}.code`}
          render={({ field }) => (
            <Input
              id={`acceptanceCriteria.${idx}.code`}
              placeholder="VD: AC-01"
              {...field}
            />
          )}
        />
      </Field>
      <FieldSet>
        <FieldLegend variant="label">Điều kiện</FieldLegend>
        <FieldGroup>
          {fields.map((f, cidx) => (
            <div key={f.id} className="flex gap-1 items-start">
              <div className="flex-1 grid grid-cols-[8rem_1fr] gap-2">
                <Field>
                  <FieldLabel
                    htmlFor={`acceptanceCriteria.${idx}.criterias.${cidx}.type`}
                  >
                    Loại
                  </FieldLabel>
                  <Controller
                    control={control}
                    name={`acceptanceCriteria.${idx}.criterias.${cidx}.type`}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id={`acceptanceCriteria.${idx}.criterias.${cidx}.type`}
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
                    !!errors.acceptanceCriteria?.[idx]?.criterias?.[cidx]
                      ?.step || undefined
                  }
                >
                  <FieldLabel
                    htmlFor={`acceptanceCriteria.${idx}.criterias.${cidx}.step`}
                  >
                    Nội dung
                  </FieldLabel>
                  <Controller
                    control={control}
                    name={`acceptanceCriteria.${idx}.criterias.${cidx}.step`}
                    render={({ field }) => (
                      <Input
                        id={`acceptanceCriteria.${idx}.criterias.${cidx}.step`}
                        {...field}
                      />
                    )}
                  />
                </Field>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(cidx)}
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
            onClick={() => append({ type: CriteriaCondition.Given, step: "" })}
          >
            <Plus />
            Thêm điều kiện
          </Button>
        </FieldGroup>
      </FieldSet>
    </div>
  );
}
