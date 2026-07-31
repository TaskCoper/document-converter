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
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMembers } from "@/features/projects/hooks/use-members";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray } from "react-hook-form";
import type { SectionProps } from "../section-types";
import {
  Position,
  PositionLabel,
  Priority,
  PriorityLabel,
  Status,
  StatusLabel,
} from "../validations";

export function MetadataSection({
  register,
  control,
  errors,
  backend,
  projectId,
  setValue,
}: SectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "metadata.assignee",
  });
  const {
    members,
    isLoading: membersLoading,
    isError: membersError,
  } = useMembers(backend ? projectId : undefined);

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

        {/* Nhánh backend có ô "Trạng thái" riêng ở khối Thông tin tài liệu (dải DocumentStatus
            10-13) và CHÍNH nó mới được gửi đi. Hiện thêm ô này chỉ tạo ra hai ô trạng thái
            mâu thuẫn nhau trên cùng màn hình, ô dưới thì không có tác dụng gì. */}
        {!backend && (
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
        )}

        <Field data-invalid={!!errors.metadata?.creator || undefined}>
          <FieldLabel htmlFor="metadata.creator" className="gap-0.5">
            Người tạo
            <span className="text-muted-foreground">
              (tự động từ tên đăng nhập)
            </span>
          </FieldLabel>
          <Input
            id="metadata.creator"
            readOnly
            tabIndex={-1}
            className="bg-muted/40 cursor-not-allowed"
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
            {backend && membersLoading && (
              <p
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                role="status"
              >
                <Spinner className="size-3" />
                Đang tải thành viên dự án…
              </p>
            )}
            {backend && membersError && (
              <FieldError role="alert">
                Không tải được thành viên dự án. Vui lòng thử tải lại trang.
              </FieldError>
            )}
            {backend &&
              !membersLoading &&
              !membersError &&
              members.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Dự án chưa có thành viên để giao việc.
                </p>
              )}
            {fields.map((f, idx) => (
              <div key={f.id} className="flex gap-1 items-start">
                <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {backend ? (
                    <Field
                      data-invalid={
                        !!errors.metadata?.assignee?.[idx]?.userId || undefined
                      }
                    >
                      <FieldLabel
                        htmlFor={`metadata.assignee.${idx}.userId`}
                      >
                        Thành viên
                      </FieldLabel>
                      {/* Tên chỉ dùng cho preview/export cũ và luôn được suy ra từ member
                          đã chọn; request backend chỉ gửi userId + role. */}
                      <input
                        type="hidden"
                        {...register(`metadata.assignee.${idx}.name`)}
                      />
                      <Controller
                        control={control}
                        name={`metadata.assignee.${idx}.userId`}
                        render={({ field }) => {
                          const selectedMember = members.find(
                            (item) => item.userId === field.value,
                          );

                          return (
                            <>
                              <Select
                                value={field.value ?? ""}
                                onValueChange={(userId) => {
                                  field.onChange(userId);
                                  const member = members.find(
                                    (item) => item.userId === userId,
                                  );
                                  if (member) {
                                    setValue?.(
                                      `metadata.assignee.${idx}.name`,
                                      member.fullName || member.email,
                                      {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      },
                                    );
                                  }
                                }}
                                disabled={
                                  membersLoading ||
                                  membersError ||
                                  members.length === 0
                                }
                              >
                                <SelectTrigger
                                  id={`metadata.assignee.${idx}.userId`}
                                  className="w-full"
                                  aria-invalid={
                                    !!errors.metadata?.assignee?.[idx]
                                      ?.userId || undefined
                                  }
                                >
                                  <SelectValue placeholder="Chọn thành viên">
                                    {selectedMember
                                      ? selectedMember.fullName ||
                                        selectedMember.email
                                      : undefined}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {members.map((member) => (
                                    <SelectItem
                                      key={member.userId}
                                      value={member.userId}
                                    >
                                      {member.fullName || member.email}
                                      <span className="text-muted-foreground">
                                        · {member.email}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {!field.value && f.name && (
                                <p className="text-[11px] text-amber-700">
                                  Dữ liệu cũ: {f.name}. Hãy chọn lại một thành
                                  viên dự án.
                                </p>
                              )}
                            </>
                          );
                        }}
                      />
                      {errors.metadata?.assignee?.[idx]?.userId?.message && (
                        <FieldError>
                          {errors.metadata.assignee[idx]?.userId?.message}
                        </FieldError>
                      )}
                    </Field>
                  ) : (
                    <>
                      <input
                        type="hidden"
                        {...register(`metadata.assignee.${idx}.userId`)}
                      />
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
                            !!errors.metadata?.assignee?.[idx]?.name ||
                            undefined
                          }
                          {...register(`metadata.assignee.${idx}.name`)}
                        />
                        {errors.metadata?.assignee?.[idx]?.name?.message && (
                          <FieldError>
                            {errors.metadata.assignee[idx]?.name?.message}
                          </FieldError>
                        )}
                      </Field>
                    </>
                  )}
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
              onClick={() =>
                append({ name: "", position: Position.FE, userId: null })
              }
              disabled={
                backend &&
                (membersLoading || membersError || members.length === 0)
              }
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
