import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { errorDetail } from "../error";
import {
  useChangeMemberRole,
  useRemoveMember,
} from "../hooks/use-member-mutations";
import type { MemberInfo, ProjectRole } from "../types";
import { RoleBadge } from "./role-badge";
import { RoleSelect } from "./role-select";

interface MembersTableProps {
  projectId: string;
  members: MemberInfo[];
  canManage: boolean;
  currentUserId?: string;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
};

export function MembersTable({
  projectId,
  members,
  canManage,
  currentUserId,
}: MembersTableProps) {
  const changeRole = useChangeMemberRole(projectId);
  const removeMember = useRemoveMember(projectId);
  const [pendingRemove, setPendingRemove] = useState<MemberInfo | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const onChangeRole = (member: MemberInfo, role: ProjectRole) => {
    if (role === member.role) return;
    setActionError(null);
    setBusyUserId(member.userId);
    changeRole.mutate(
      { userId: member.userId, role },
      {
        onError: (err) =>
          setActionError(errorDetail(err, "Không đổi được vai trò.")),
        onSettled: () => setBusyUserId(null),
      },
    );
  };

  const confirmRemove = () => {
    if (!pendingRemove) return;
    const target = pendingRemove;
    setActionError(null);
    setBusyUserId(target.userId);
    removeMember.mutate(target.userId, {
      onSuccess: () => setPendingRemove(null),
      onError: (err) => {
        setActionError(errorDetail(err, "Không xoá được thành viên."));
        setPendingRemove(null);
      },
      onSettled: () => setBusyUserId(null),
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {actionError && (
        <p className="text-xs text-destructive">{actionError}</p>
      )}

      <div className="overflow-x-auto border border-border/40">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-muted/60">
            <tr>
              <th className="w-10 border border-border/40 px-2 py-1.5 text-left text-[10px] font-medium text-muted-foreground">
                #
              </th>
              <th className="border border-border/40 px-2 py-1.5 text-left font-medium">
                Thành viên
              </th>
              <th className="w-44 border border-border/40 px-2 py-1.5 text-left font-medium">
                Vai trò
              </th>
              <th className="w-28 border border-border/40 px-2 py-1.5 text-left font-medium">
                Tham gia
              </th>
              {canManage && (
                <th className="w-16 border border-border/40 px-2 py-1.5 text-center font-medium">
                  Xoá
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => {
              const isSelf = member.userId === currentUserId;
              const isBusy = busyUserId === member.userId;
              return (
                <tr key={member.userId} className="hover:bg-primary/5">
                  <td className="border border-border/40 px-2 py-1.5 text-[10px] text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="border border-border/40 px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">
                        {member.fullName || member.email}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] text-muted-foreground">
                          (Bạn)
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {member.email}
                    </div>
                  </td>
                  <td className="border border-border/40 px-2 py-1.5">
                    {canManage ? (
                      <div className="flex items-center gap-1.5">
                        <RoleSelect
                          value={member.role}
                          onChange={(role) => onChangeRole(member, role)}
                          disabled={isBusy}
                        />
                        {isBusy && <Spinner className="size-3" />}
                      </div>
                    ) : (
                      <RoleBadge role={member.role} />
                    )}
                  </td>
                  <td className="border border-border/40 px-2 py-1.5 text-muted-foreground">
                    {formatDate(member.joinedAt)}
                  </td>
                  {canManage && (
                    <td className="border border-border/40 px-2 py-1.5 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        disabled={isBusy}
                        onClick={() => setPendingRemove(member)}
                        title="Xoá khỏi dự án"
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AlertDialog
        open={!!pendingRemove}
        onOpenChange={(open) => !open && setPendingRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá thành viên khỏi dự án?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemove?.fullName || pendingRemove?.email} sẽ mất quyền
              truy cập dự án. Bạn có thể thêm lại sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRemove();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {removeMember.isPending && <Spinner />}
              Xoá thành viên
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
