import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  PROJECT_ROLE_ORDER,
  ProjectRoleDescription,
  ProjectRoleLabel,
  type ProjectRole,
} from "../types";

interface RoleSelectProps {
  value: ProjectRole;
  onChange: (role: ProjectRole) => void;
  disabled?: boolean;
  className?: string;
  withDescription?: boolean;
  disabledReason?: string;
}

// Select vai trò dùng chung cho "thêm thành viên" và "đổi quyền". Giá trị là SỐ (ProjectRole),
// nhưng Select thao tác bằng chuỗi nên convert ở biên.
export function RoleSelect({
  value,
  onChange,
  disabled,
  className,
  withDescription,
  disabledReason,
}: RoleSelectProps) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v) as ProjectRole)}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn("h-8 text-xs", className)}
        title={disabledReason}
        aria-label={
          disabledReason
            ? `${ProjectRoleLabel[value]}. ${disabledReason}`
            : undefined
        }
      >
        {/* base-ui Select.Value hiển thị giá trị THÔ (chuỗi số) nếu không có hàm map —
            phải tự đổi số sang nhãn tiếng Việt. */}
        <SelectValue>
          {(v) => ProjectRoleLabel[Number(v) as ProjectRole] ?? ""}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PROJECT_ROLE_ORDER.map((role) => (
          <SelectItem key={role} value={String(role)} className="text-xs">
            {withDescription ? (
              <div className="flex flex-col">
                <span>{ProjectRoleLabel[role]}</span>
                <span className="text-[10px] text-muted-foreground">
                  {ProjectRoleDescription[role]}
                </span>
              </div>
            ) : (
              ProjectRoleLabel[role]
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
