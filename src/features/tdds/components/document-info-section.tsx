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
import { Controller } from "react-hook-form";
import type { TddSectionProps } from "../section-types";
import { DocStatus, DocStatusLabel } from "../validations";
import { TddStringArrayField } from "./tdd-string-array-field";

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
