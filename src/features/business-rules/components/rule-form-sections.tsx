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
  RuleStatus,
  RuleStatusLabel,
  type RuleSchema,
} from "../validations";

export type RuleSectionProps = {
  register: UseFormRegister<RuleSchema>;
  control: Control<RuleSchema>;
  errors: FieldErrors<RuleSchema>;
};

export function RuleIdentitySection({
  register,
  control,
  errors,
}: RuleSectionProps) {
  return (
    <FieldSet>
      <FieldLegend>Định danh & Phân loại</FieldLegend>
      <FieldGroup>
        <Field data-invalid={!!errors.ruleId || undefined}>
          <FieldLabel htmlFor="ruleId">Rule ID</FieldLabel>
          <Input
            id="ruleId"
            placeholder="VD: BR-07"
            aria-invalid={!!errors.ruleId || undefined}
            {...register("ruleId")}
          />
          {errors.ruleId?.message && (
            <FieldError>{errors.ruleId.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.name || undefined}>
          <FieldLabel htmlFor="name">Tên rule</FieldLabel>
          <Input
            id="name"
            placeholder="VD: Phụ phí VAT khách doanh nghiệp"
            aria-invalid={!!errors.name || undefined}
            {...register("name")}
          />
          {errors.name?.message && (
            <FieldError>{errors.name.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.category || undefined}>
          <FieldLabel htmlFor="category">Danh mục</FieldLabel>
          <Input
            id="category"
            placeholder="VD: Tax / Pricing"
            aria-invalid={!!errors.category || undefined}
            {...register("category")}
          />
          {errors.category?.message && (
            <FieldError>{errors.category.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.status || undefined}>
          <FieldLabel htmlFor="status">Trạng thái</FieldLabel>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="status"
                  className="w-full"
                  aria-invalid={!!errors.status || undefined}
                >
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RuleStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {RuleStatusLabel[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field data-invalid={!!errors.version || undefined}>
          <FieldLabel htmlFor="version">Version</FieldLabel>
          <Input
            id="version"
            placeholder="VD: v1.1"
            aria-invalid={!!errors.version || undefined}
            {...register("version")}
          />
          {errors.version?.message && (
            <FieldError>{errors.version.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.effectiveDate || undefined}>
          <FieldLabel htmlFor="effectiveDate">
            Ngày hiệu lực (YYYY-MM-DD)
          </FieldLabel>
          <Input
            id="effectiveDate"
            type="date"
            aria-invalid={!!errors.effectiveDate || undefined}
            {...register("effectiveDate")}
          />
          {errors.effectiveDate?.message && (
            <FieldError>{errors.effectiveDate.message}</FieldError>
          )}
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}

export function RuleLogicSection({ register, errors }: RuleSectionProps) {
  return (
    <FieldSet>
      <FieldLegend>Nội dung rule</FieldLegend>
      <FieldGroup>
        <Field data-invalid={!!errors.statement || undefined}>
          <FieldLabel htmlFor="statement">Phát biểu (Statement)</FieldLabel>
          <Textarea
            id="statement"
            placeholder="Mô tả ngắn gọn nội dung của rule"
            aria-invalid={!!errors.statement || undefined}
            {...register("statement")}
          />
          {errors.statement?.message && (
            <FieldError>{errors.statement.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.when || undefined}>
          <FieldLabel htmlFor="when">Điều kiện (When)</FieldLabel>
          <Textarea
            id="when"
            placeholder="Khi nào rule được kích hoạt"
            aria-invalid={!!errors.when || undefined}
            {...register("when")}
          />
          {errors.when?.message && (
            <FieldError>{errors.when.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.then || undefined}>
          <FieldLabel htmlFor="then">Hành vi (Then)</FieldLabel>
          <Textarea
            id="then"
            placeholder="Hệ thống làm gì khi điều kiện thoả"
            aria-invalid={!!errors.then || undefined}
            {...register("then")}
          />
          {errors.then?.message && (
            <FieldError>{errors.then.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.except || undefined}>
          <FieldLabel htmlFor="except">Ngoại lệ (Except)</FieldLabel>
          <Textarea
            id="except"
            placeholder="Trường hợp không áp dụng rule (nếu có)"
            aria-invalid={!!errors.except || undefined}
            {...register("except")}
          />
          {errors.except?.message && (
            <FieldError>{errors.except.message}</FieldError>
          )}
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}

export function RuleGovernanceSection({
  register,
  control,
  errors,
}: RuleSectionProps) {
  const relatedArr = useFieldArray({
    control,
    name: "relatedStories" as never,
  });

  return (
    <FieldSet>
      <FieldLegend>Quản trị & Tham chiếu</FieldLegend>
      <FieldGroup>
        <Field data-invalid={!!errors.source || undefined}>
          <FieldLabel htmlFor="source">Nguồn</FieldLabel>
          <Input
            id="source"
            placeholder="VD: Chính sách kế toán nội bộ"
            aria-invalid={!!errors.source || undefined}
            {...register("source")}
          />
          {errors.source?.message && (
            <FieldError>{errors.source.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.owner || undefined}>
          <FieldLabel htmlFor="owner">Người sở hữu</FieldLabel>
          <Input
            id="owner"
            placeholder="VD: Kế toán trưởng"
            aria-invalid={!!errors.owner || undefined}
            {...register("owner")}
          />
          {errors.owner?.message && (
            <FieldError>{errors.owner.message}</FieldError>
          )}
        </Field>

        <FieldSet>
          <FieldLegend variant="label">Story liên quan</FieldLegend>
          <FieldGroup className="gap-1">
            {relatedArr.fields.map((f, idx) => (
              <div key={f.id} className="flex gap-1 items-center">
                <Input
                  placeholder="VD: HTM-142"
                  {...register(`relatedStories.${idx}` as never)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => relatedArr.remove(idx)}
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
              onClick={() => relatedArr.append("" as never)}
            >
              <Plus />
              Thêm
            </Button>
          </FieldGroup>
        </FieldSet>

        <Field data-invalid={!!errors.notes || undefined}>
          <FieldLabel htmlFor="notes">Ghi chú / Link logic</FieldLabel>
          <Textarea
            id="notes"
            placeholder="VD: Làm tròn VND SAU khi cộng surcharge (xem BR-03)"
            aria-invalid={!!errors.notes || undefined}
            {...register("notes")}
          />
          {errors.notes?.message && (
            <FieldError>{errors.notes.message}</FieldError>
          )}
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
