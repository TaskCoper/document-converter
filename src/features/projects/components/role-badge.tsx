import { Badge } from "@/components/ui/badge";
import { ProjectRole, ProjectRoleLabel } from "../types";

const VARIANT: Record<
  ProjectRole,
  "default" | "secondary" | "outline" | "destructive"
> = {
  [ProjectRole.Owner]: "default",
  [ProjectRole.Admin]: "secondary",
  [ProjectRole.Editor]: "outline",
  [ProjectRole.Viewer]: "outline",
};

export function RoleBadge({ role }: { role: ProjectRole }) {
  return (
    <Badge variant={VARIANT[role]} className="text-[10px]">
      {ProjectRoleLabel[role]}
    </Badge>
  );
}
