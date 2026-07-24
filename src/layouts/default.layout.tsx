import { Button } from "@/components/ui/button";
import AuthWidget from "@/features/auth/components/auth-widget";
import { DocumentTabBar } from "@/features/projects/components/document-tab-bar";
import { ProjectSearchPalette } from "@/features/projects/components/project-search-palette";
import { useActiveRepo } from "@/features/repos/store";
import { cn } from "@/lib/utils";
import {
  BookUserIcon,
  FileCode2Icon,
  FolderGit2Icon,
  HomeIcon,
  ScaleIcon,
  SearchIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";

const NAV = [
  { to: "/browse", label: "Trang chủ", end: false, icon: HomeIcon },
  { to: "/stories", label: "Thêm User Story", icon: BookUserIcon },
  { to: "/tdd", label: "Thêm TDD", icon: FileCode2Icon },
  { to: "/rules", label: "Thêm Rule", icon: ScaleIcon },
];


export default function DefaultLayout() {
  const activeRepo = useActiveRepo();
  const { pathname } = useLocation();
  const onPicker = pathname === "/";
  // Trang không phụ thuộc kho GitHub (dữ liệu lấy từ backend): hồ sơ và dự án.
  const isRepoIndependent =
    pathname === "/profile" || pathname.startsWith("/projects");

  // Search API chỉ scope theo project (GET /projects/{projectId}/search) — lấy id từ URL
  // thay vì useParams() vì DefaultLayout nằm NGOÀI route con /projects/:projectId/*.
  const projectId = pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? null;
  // Chỉ hiện thanh tab điều hướng nhanh khi đang ở trang CHI TIẾT 1 tài liệu cụ thể — không
  // hiện ở danh sách/sửa/lịch sử phiên bản/cấu hình/đồ thị.
  const currentDocumentId = pathname.match(
    /^\/projects\/[^/]+\/documents\/([^/]+)$/,
  )?.[1];
  const showDocTabBar = !!projectId && !!currentDocumentId;
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [projectId]);

  if (!activeRepo && !onPicker && !isRepoIndependent) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="z-40 shrink-0 border-b border-border bg-background">
        <div className="mx-auto flex h-12 items-center gap-4 px-2">

          {/* Dự án lấy dữ liệu từ backend, không phụ thuộc kho GitHub → luôn hiện. */}
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 rounded-none px-2.5 py-1 text-xs transition-colors hover:bg-muted",
                isActive && "bg-primary text-primary-foreground",
              )
            }
          >
            <FolderGit2Icon className="size-3.5" />
            Dự án
          </NavLink>

          {activeRepo && !onPicker && (
            <nav className="flex items-center gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "rounded-none px-2.5 py-1 text-xs transition-colors hover:bg-muted",
                      isActive && "bg-primary text-primary-foreground",
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    {item.icon && <item.icon className="size-3.5" />}
                    {item.label}
                  </div>
                </NavLink>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={!projectId}
              title={
                projectId
                  ? "Tìm kiếm trong dự án (⌘K)"
                  : "Mở một dự án để tìm kiếm"
              }
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon className="size-3.5" />
              Tìm kiếm
            </Button>
            <AuthWidget />
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {showDocTabBar && (
        <DocumentTabBar
          projectId={projectId!}
          currentDocumentId={currentDocumentId}
        />
      )}

      {projectId && (
        <ProjectSearchPalette
          projectId={projectId}
          open={searchOpen}
          onOpenChange={setSearchOpen}
        />
      )}
    </div>
  );
}
