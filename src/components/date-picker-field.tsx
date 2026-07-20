import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDateFormat } from "@/lib/date";
import { cn } from "@/lib/utils";
import { CalendarIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import type { Matcher } from "react-day-picker";
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
  useFormContext,
} from "react-hook-form";

interface DateConstraints {
  minDate?: Date;
  maxDate?: Date;
  disabled?: Matcher | Matcher[];
}

interface DatePickerFieldProps<T extends FieldValues> extends DateConstraints {
  name: Path<T>;
  label: string;
  control?: Control<T>;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  displayError?: boolean;
}

export function DatePickerField<T extends FieldValues>({
  name,
  label,
  control: propsControl,
  onValueChange,
  placeholder = "Chọn ngày",
  isRequired = false,
  isDisabled = false,
  className,
  displayError = true,
  minDate = new Date("1900-01-01"),
  maxDate = new Date(new Date().getFullYear() + 10, 11, 31),
  disabled,
}: DatePickerFieldProps<T>) {
  const { formatDate } = useDateFormat();
  const [open, setOpen] = useState(false);

  const context = useFormContext<T>();
  const control = propsControl || context?.control;

  if (!control) {
    throw new Error(
      "DatePickerField must be used within a FormProvider or passed a control prop",
    );
  }

  const disabledDays: Matcher[] = [
    ...(Array.isArray(disabled) ? disabled : disabled ? [disabled] : []),
    { before: minDate },
    { after: maxDate },
  ];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid}
          className={cn("gap-1", className)}
        >
          <FieldLabel htmlFor={field.name} className="gap-0.5">
            {label}
            {isRequired ? (
              <span className="text-destructive font-semibold">*</span>
            ) : (
              <span className="text-muted-foreground text-xs">(Tùy chọn)</span>
            )}
          </FieldLabel>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>
              <Button
                id={field.name}
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-invalid={fieldState.invalid}
                disabled={isDisabled}
                className={cn(
                  "w-full justify-between px-3 text-left font-normal",
                  !field.value && "text-muted-foreground",
                  fieldState.invalid &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <CalendarIcon className="opacity-50 size-4" />
                  {field.value ? (
                    formatDate(field.value, "dateLong")
                  ) : (
                    <span>{placeholder}</span>
                  )}
                </span>

                {field.value && !isDisabled && (
                  <div
                    role="button"
                    tabIndex={0}
                    className="hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      field.onChange(null);
                      onValueChange?.(null);
                    }}
                  >
                    <XCircleIcon className="size-4 opacity-50 hover:opacity-100" />
                    <span className="sr-only">Xóa</span>
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              sideOffset={8}
              className="w-auto p-0 max-h-[calc(var(--radix-popover-content-available-height)-8px)] overflow-y-auto"
              align="start"
            >
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) => {
                  const newValue = date?.toISOString() ?? null;
                  field.onChange(newValue);
                  onValueChange?.(newValue);
                  setOpen(false);
                }}
                disabled={disabledDays}
                startMonth={minDate}
                endMonth={maxDate}
                captionLayout="dropdown"
                defaultMonth={field.value ? new Date(field.value) : new Date()}
              />
            </PopoverContent>
          </Popover>

          {displayError && (
            <div className="min-h-4">
              {fieldState.invalid && (
                <FieldError className="text-xs" errors={[fieldState.error]} />
              )}
            </div>
          )}
        </Field>
      )}
    />
  );
}
