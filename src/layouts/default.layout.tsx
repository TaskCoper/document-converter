import { Button } from "@/components/ui/button";
import AuthWidget from "@/features/auth/components/auth-widget";
import { ApplicationSidebar } from "@/features/navigation/components/application-sidebar";
import { DocumentTabBar } from "@/features/projects/components/document-tab-bar";
import { ProjectSearchPalette } from "@/features/projects/components/project-search-palette";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function DefaultLayout() {
  const { pathname } = useLocation();

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

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="z-40 shrink-0 border-b border-border bg-background">
        <div className="mx-auto flex h-12 items-center gap-4 px-2">

          <Link
            to="/projects"
            title="Về trang Dự án"
            className="flex h-10 items-center gap-3 rounded-sm px-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <img
              src="/logo-header.png"
              alt="Document First"
              width={480}
              height={219}
              className="h-9 w-auto object-contain"
            />
            <span
              aria-hidden="true"
              className="hidden items-center gap-1 border-l border-border pl-3 text-2xl font-bold leading-none tracking-tight sm:inline-flex"
            >
              <span>Document</span>
              <span className="text-primary">First</span>
            </span>
          </Link>

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

      <div className="flex min-h-0 flex-1">
        <ApplicationSidebar projectId={projectId} />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <Outlet />
          </main>

          {showDocTabBar && (
            <DocumentTabBar
              projectId={projectId!}
              currentDocumentId={currentDocumentId}
            />
          )}
        </div>
      </div>

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
