import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface NumberOption {
  value: number;
  label: string;
}

interface NumberSelectProps {
  value: number | null;
  onChange: (value: number) => void;
  options: NumberOption[];
  id?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

// Select cho giá trị SỐ (enum backend). base-ui Select.Value hiển thị giá trị thô nếu không
// có hàm map, nên phải tự đổi số → nhãn.
export function NumberSelect({
  value,
  onChange,
  options,
  id,
  className,
  placeholder,
  disabled,
}: NumberSelectProps) {
  return (
    <Select
      value={value == null ? "" : String(value)}
      onValueChange={(v) => onChange(Number(v))}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn("h-8 text-xs", className)}>
        <SelectValue placeholder={placeholder}>
          {(v) => options.find((o) => String(o.value) === v)?.label ?? ""}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={String(o.value)} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
