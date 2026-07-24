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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/features/auth/store";
import { AddMemberDialog } from "@/features/projects/components/add-member-dialog";
import { EditProjectDialog } from "@/features/projects/components/edit-project-dialog";
import { MembersTable } from "@/features/projects/components/members-table";
import { PublishJobsSection } from "@/features/projects/components/publish-jobs-section";
import { RepositoriesSection } from "@/features/projects/components/repositories-section";
import { RoleBadge } from "@/features/projects/components/role-badge";
import { errorDetail } from "@/features/projects/error";
import { useDeleteProject } from "@/features/projects/hooks/use-project-mutations";
import { useMembers } from "@/features/projects/hooks/use-members";
import { useProject } from "@/features/projects/hooks/use-project";
import {
  canDeleteProject,
  canEditProject,
  canManageMembers,
  canManageRepositories,
} from "@/features/projects/permissions";
import {
  ArrowLeftIcon,
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
};

// Trang cấu hình dự án — thành viên + kết nối kho GitHub. Trước đây đây là trang "mở dự án"
// mặc định; giờ mở dự án đi thẳng vào /documents, trang này chỉ còn truy cập qua nút "Cấu
// hình" ở project-documents.page.tsx.
export default function ProjectSettingsPage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((s) => s.user?.UserId);

  const { project, isLoading, isError } = useProject(projectId);
  const { members, isLoading: membersLoading } = useMembers(projectId);
  const deleteProject = useDeleteProject(projectId);

  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Vai trò của mình trong project suy ra từ danh sách thành viên (ProjectDetail không
  // trả về myRole). Chưa có thì khoá mọi hành động cho an toàn.
  const myRole = members.find((m) => m.userId === currentUserId)?.role;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Không tìm thấy dự án, hoặc bạn không có quyền truy cập.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          render={<Link to="/projects" />}
        >
          <ArrowLeftIcon className="size-3.5" />
          Về danh sách dự án
        </Button>
      </div>
    );
  }

  const confirmDelete = () => {
    setDeleteError(null);
    deleteProject.mutate(undefined, {
      onSuccess: () => {
        setDeleteOpen(false);
        navigate("/projects", { replace: true });
      },
      onError: (err) => {
        setDeleteError(errorDetail(err, "Không xoá được dự án."));
        setDeleteOpen(false);
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link
        to={`/projects/${projectId}/documents`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeftIcon className="size-3.5" />
        Tài liệu
      </Link>

      {/* Header dự án */}
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Cấu hình dự án
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {project.code}
            </span>
            {myRole && <RoleBadge role={myRole} />}
          </div>
          <h1 className="mt-1 text-xl font-semibold">{project.name}</h1>
          {project.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {myRole && canEditProject(myRole) && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <PencilIcon className="size-3.5" />
              Sửa
            </Button>
          )}
          {myRole && canDeleteProject(myRole) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon className="size-3.5" />
              Xoá
            </Button>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-[10px]">
          <UsersIcon className="mr-1 size-3" />
          {project.memberCount} thành viên
        </Badge>
        <Link to={`/projects/${project.id}/documents`}>
          <Badge
            variant="secondary"
            className="cursor-pointer text-[10px] hover:bg-primary/10"
          >
            <FileTextIcon className="mr-1 size-3" />
            {project.documentCount} tài liệu
          </Badge>
        </Link>
        <Badge variant="outline" className="text-[10px]">
          Tạo: {formatDate(project.createdAt)}
        </Badge>
        {project.updatedAt && (
          <Badge variant="outline" className="text-[10px]">
            Sửa: {formatDate(project.updatedAt)}
          </Badge>
        )}
      </div>

      {deleteError && (
        <p className="mt-3 text-xs text-destructive">{deleteError}</p>
      )}

      {/* Thành viên */}
      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-primary">
            Thành viên ({project.memberCount})
          </h2>
          {myRole && canManageMembers(myRole) && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <PlusIcon className="size-3.5" />
              Thêm thành viên
            </Button>
          )}
        </div>

        <div className="mt-3">
          {membersLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <MembersTable
              projectId={project.id}
              members={members}
              canManage={!!myRole && canManageMembers(myRole)}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </div>

      {/* Kho GitHub — chỉ Admin+ mới xem/quản lý được (GET repositories cũng yêu cầu Admin). */}
      {myRole && canManageRepositories(myRole) && (
        <>
          <RepositoriesSection projectId={project.id} />
          <PublishJobsSection projectId={project.id} />
        </>
      )}

      <EditProjectDialog
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <AddMemberDialog
        projectId={project.id}
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá dự án này?</AlertDialogTitle>
            <AlertDialogDescription>
              Toàn bộ dữ liệu dự án "{project.name}" sẽ bị xoá. Hành động này
              không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteProject.isPending && <Spinner />}
              Xoá dự án
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
