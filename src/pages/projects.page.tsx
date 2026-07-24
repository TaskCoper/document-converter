import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { RoleBadge } from "@/features/projects/components/role-badge";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { FolderGit2Icon, PlusIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProjectsPage() {
  const { projects, isLoading, isError, noBackend } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-primary">Dự án</h1>
          <p className="text-xs text-muted-foreground">
            Các dự án bạn là thành viên. Tạo dự án mới để bắt đầu cộng tác.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-3.5" />
          Tạo dự án
        </Button>
      </div>

      <div className="mt-4">
        {noBackend ? (
          <p className="py-10 text-center text-xs text-muted-foreground">
            Chưa cấu hình backend xác thực (hoặc đang dùng đăng nhập giả). Không
            thể tải danh sách dự án.
          </p>
        ) : isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : isError ? (
          <p className="py-10 text-center text-xs text-destructive">
            Không tải được danh sách dự án.
          </p>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-dashed border-border py-12 text-center">
            <FolderGit2Icon className="size-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Chưa có dự án nào. Tạo dự án đầu tiên để bắt đầu.
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-3.5" />
              Tạo dự án
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border/40">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-muted/60">
                <tr>
                  <th className="w-10 border border-border/40 px-2 py-1.5 text-left text-[10px] font-medium text-muted-foreground">
                    #
                  </th>
                  <th className="w-40 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Mã
                  </th>
                  <th className="border border-border/40 px-2 py-1.5 text-left font-medium">
                    Tên dự án
                  </th>
                  <th className="w-32 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Vai trò
                  </th>
                  <th className="w-28 border border-border/40 px-2 py-1.5 text-left font-medium">
                    Thành viên
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, index) => (
                  <tr
                    key={project.id}
                    className="cursor-pointer hover:bg-primary/5"
                    onClick={() =>
                      navigate(`/projects/${project.id}/documents`)
                    }
                  >
                    <td className="border border-border/40 px-2 py-1.5 text-[10px] text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="border border-border/40 px-2 py-1.5 font-mono text-muted-foreground">
                      {project.code}
                    </td>
                    <td className="border border-border/40 px-2 py-1.5 font-medium">
                      {project.name}
                    </td>
                    <td className="border border-border/40 px-2 py-1.5">
                      <RoleBadge role={project.myRole} />
                    </td>
                    <td className="border border-border/40 px-2 py-1.5 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <UsersIcon className="size-3" />
                        {project.memberCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(project) => {
          setCreateOpen(false);
          navigate(`/projects/${project.id}/documents`);
        }}
      />
    </div>
  );
}
