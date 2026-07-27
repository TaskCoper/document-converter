import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { Control, UseFormRegister } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import type { TddSchema } from "../validations";

/**
 * Ví dụ request/response của MỘT endpoint — chỉ có ở nhánh backend.
 *
 * Markdown không gắn ví dụ với endpoint (mỗi ví dụ là một mục cấp 4 độc lập), nên nhánh
 * GitHub vẫn dùng danh sách phẳng `internalApi.examples`. DB thì lưu ví dụ THUỘC endpoint,
 * và tách riêng request / response / status / error — bốn thứ mà ô "Nội dung" gộp một chuỗi
 * của danh sách phẳng không biểu diễn được.
 */
export function EndpointExamplesField({
  control,
  register,
  name,
}: {
  control: Control<TddSchema>;
  register: UseFormRegister<TddSchema>;
  name: `internalApi.endpoints.${number}.examples` | `externalApi.endpoints.${number}.examples`;
}) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="flex flex-col gap-2 border-l-2 border-border pl-3">
      <span className="text-xs font-medium text-muted-foreground">
        Ví dụ ({fields.length})
      </span>
      {fields.map((f, idx) => (
        <div key={f.id} className="flex flex-col gap-2 border border-border p-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Tiêu đề ví dụ"
              className="h-8"
              {...register(`${name}.${idx}.title`)}
            />
            <Input
              type="number"
              placeholder="Status"
              className="h-8 w-24"
              {...register(`${name}.${idx}.responseStatus`, {
                setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
              })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => remove(idx)}
              aria-label="Xóa ví dụ"
            >
              <Trash2 />
            </Button>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Field>
              <FieldLabel htmlFor={`${name}.${idx}.requestSample`}>
                Request
              </FieldLabel>
              <Textarea
                id={`${name}.${idx}.requestSample`}
                rows={5}
                className="font-mono text-xs"
                {...register(`${name}.${idx}.requestSample`)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${name}.${idx}.responseSample`}>
                Response
              </FieldLabel>
              <Textarea
                id={`${name}.${idx}.responseSample`}
                rows={5}
                className="font-mono text-xs"
                {...register(`${name}.${idx}.responseSample`)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${name}.${idx}.errorSample`}>
                Error
              </FieldLabel>
              <Textarea
                id={`${name}.${idx}.errorSample`}
                rows={5}
                className="font-mono text-xs"
                {...register(`${name}.${idx}.errorSample`)}
              />
            </Field>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() =>
          append({
            title: "",
            requestSample: "",
            responseSample: "",
            responseStatus: null,
            errorSample: "",
          })
        }
      >
        <Plus /> Thêm ví dụ
      </Button>
    </div>
  );
}
