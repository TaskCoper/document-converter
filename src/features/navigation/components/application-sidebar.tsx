import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ClipboardCheckIcon,
  FilesIcon,
  FolderKanbanIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

interface ApplicationSidebarProps {
  projectId: string | null;
}

const desktopMediaQuery = "(min-width: 1024px)";
const sidebarPreferenceKey = "document-first.sidebar.expanded";

const readInitialExpanded = () => {
  if (!window.matchMedia(desktopMediaQuery).matches) return false;
  return window.localStorage.getItem(sidebarPreferenceKey) !== "false";
};

export function ApplicationSidebar({ projectId }: ApplicationSidebarProps) {
  const [expanded, setExpanded] = useState(readInitialExpanded);
  const items = projectId
    ? [
        {
          to: `/projects/${projectId}/documents`,
          label: "Tài liệu",
          icon: FilesIcon,
          end: false,
        },
        {
          to: `/projects/${projectId}/reviews`,
          label: "Cần duyệt",
          icon: ClipboardCheckIcon,
          end: true,
        },
      ]
    : [
        {
          to: "/projects",
          label: "Dự án",
          icon: FolderKanbanIcon,
          end: true,
        },
        {
          to: "/reviews",
          label: "Cần duyệt",
          icon: ClipboardCheckIcon,
          end: true,
        },
      ];

  useEffect(() => {
    const media = window.matchMedia(desktopMediaQuery);
    const onBreakpointChange = (event: MediaQueryListEvent) => {
      setExpanded(
        event.matches
          ? window.localStorage.getItem(sidebarPreferenceKey) !== "false"
          : false,
      );
    };

    media.addEventListener("change", onBreakpointChange);
    return () => media.removeEventListener("change", onBreakpointChange);
  }, []);

  useEffect(() => {
    if (window.matchMedia(desktopMediaQuery).matches) {
      window.localStorage.setItem(sidebarPreferenceKey, String(expanded));
    }
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !window.matchMedia(desktopMediaQuery).matches
      ) {
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  const collapseAfterNavigation = () => {
    if (!window.matchMedia(desktopMediaQuery).matches) setExpanded(false);
  };

  return (
    <aside
      className={cn(
        "relative z-30 w-14 shrink-0 transition-[width] duration-200 motion-reduce:transition-none",
        expanded ? "lg:w-52" : "lg:w-14",
      )}
    >
      {expanded && (
        <button
          type="button"
          aria-label="Đóng navigation"
          className="fixed bottom-0 left-52 right-0 top-12 bg-foreground/10 lg:hidden"
          onClick={() => setExpanded(false)}
        />
      )}

      <div
        className={cn(
          "theme-web-surface absolute inset-y-0 left-0 z-10 flex flex-col border-r border-border bg-background transition-[width] duration-200 motion-reduce:transition-none",
          expanded ? "w-52 shadow-lg lg:shadow-none" : "w-14",
        )}
      >
        <nav
          id="application-sidebar-navigation"
          aria-label="Điều hướng chính"
          className="flex-1 space-y-1 p-1.5 sm:p-2"
        >
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              aria-label={expanded ? undefined : item.label}
              onClick={collapseAfterNavigation}
              className={({ isActive }) =>
                cn(
                  "flex min-h-9 items-center gap-2 border-l-2 border-transparent px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  expanded ? "justify-start" : "justify-center",
                  isActive &&
                    "border-l-primary bg-primary/10 font-medium text-primary",
                )
              }
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              {expanded && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-border p-1.5 sm:p-2">
          <Button
            type="button"
            variant="ghost"
            size={expanded ? "sm" : "icon-sm"}
            className={cn(
              "h-9",
              expanded ? "w-full justify-start" : "mx-auto flex w-9",
            )}
            aria-controls="application-sidebar-navigation"
            aria-expanded={expanded}
            aria-label={expanded ? "Thu gọn navigation" : "Mở navigation"}
            title={expanded ? "Thu gọn navigation" : "Mở navigation"}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? (
              <PanelLeftCloseIcon aria-hidden="true" />
            ) : (
              <PanelLeftOpenIcon aria-hidden="true" />
            )}
            {expanded && <span>Thu gọn</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
