import { buttonVariants } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  fromRuleMarkdown,
  toRuleHtml,
} from "@/features/business-rules/exporters";
import { fromTddMarkdown, toTddHtml } from "@/features/tdds/exporters";
import { fromMarkdown, toHtml } from "@/features/user-stories/exporters";
import { useAuthorStore } from "@/features/user-stories/store";
import { detectType } from "@/lib/file-type";
import {
  messageFor,
  parentOf,
  useDir,
  useFile,
  useRenameFile,
} from "@/lib/queries";
import { isSitemapPath } from "@/lib/sitemap";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  Edit,
  ExternalLink,
  FileText,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

export default function ViewPage() {
  const { "*": rest = "" } = useParams();
  const path = rest.replace(/^\/+|\/+$/g, "");
  const navigate = useNavigate();
  const authorName = useAuthorStore((s) => s.name);
  const renameFileMutation = useRenameFile();
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const location = useLocation();
  const justCreated =
    (location.state as { justCreated?: boolean } | null)?.justCreated === true;
  const retryCount = useRef(0);
  const [retrying, setRetrying] = useState(false);

  const { data, isPending, error, refetch } = useFile(path);

  useEffect(() => {
    if (
      justCreated &&
      data === null &&
      !isPending &&
      !error &&
      retryCount.current < 5
    ) {
      setRetrying(true);
      const id = setTimeout(() => {
        retryCount.current += 1;
        refetch().finally(() => setRetrying(false));
      }, 2000);
      return () => clearTimeout(id);
    }
  }, [justCreated, data, isPending, error, refetch]);

  const folderPath = parentOf(path);
  const { data: folderEntries } = useDir(folderPath);
  const siblingFiles = (folderEntries ?? []).filter(
    (e) =>
      e.type === "file" &&
      e.name.toLowerCase().endsWith(".md") &&
      !isSitemapPath(e.path),
  );

  let html: string | null = null;

  const detectedType = data?.content ? detectType(data.content) : null;

  if (data?.content) {
    try {
      if (detectedType === "tdd") {
        html = toTddHtml(fromTddMarkdown(data.content));
      } else if (detectedType === "business-rule") {
        html = toRuleHtml(fromRuleMarkdown(data.content));
      } else {
        html = toHtml(fromMarkdown(data.content));
      }
    } catch {
      html = null;
    }
  }

  const editPath =
    detectedType === "tdd"
      ? `/edit-tdd/${path}`
      : detectedType === "business-rule"
        ? `/edit-rule/${path}`
        : `/edit/${path}`;

  if (isPending || retrying) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <p className="text-xs text-muted-foreground">Đang tải file…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6">
        <p className="text-xs text-destructive">{messageFor(error)}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6">
        <p className="text-xs">
          File <code>{path}</code> không tồn tại.
        </p>
        <Link
          to={`/browse/${parentOf(path)}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ArrowLeft className="size-3.5" />
          Quay lại thư mục
        </Link>
      </div>
    );
  }

  if (isSitemapPath(path)) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6">
        <p className="text-xs text-muted-foreground">
          File sitemap không thể xem trực tiếp.
        </p>
        <Link
          to={`/browse/${parentOf(path)}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ArrowLeft className="size-3.5" />
          Quay lại thư mục
        </Link>
      </div>
    );
  }

  const onDownload = () => {
    if (!html) return;
    const filename =
      path.split("/").pop()?.replace(/\.md$/, ".html") ?? "view.html";
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentFileName = path.split("/").pop() ?? "";

  const commitFileRename = (entry: { name: string; path: string }) => {
    const trimmed = renameValue.trim();
    setRenamingFile(null);
    if (!trimmed) return;
    const newName = trimmed.endsWith(".md") ? trimmed : `${trimmed}.md`;
    if (newName === entry.name) return;
    const newPath = folderPath ? `${folderPath}/${newName}` : newName;
    renameFileMutation.mutate(
      {
        oldPath: entry.path,
        newPath,
        message: `Rename ${entry.name} to ${newName}`,
        websiteUser: authorName,
      },
      {
        onSuccess: () => {
          if (currentFileName === entry.name) navigate(`/view/${newPath}`);
        },
      },
    );
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 3rem)" }}
    >
      <div className="shrink-0 flex items-center gap-2 p-2 border-b border-border">
        <Link
          to={`/browse/${parentOf(path)}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="size-3.5" />
          Thư mục
        </Link>

        <span className="text-xs text-muted-foreground font-mono truncate flex-1">
          {path}
        </span>

        <a
          href={data.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ExternalLink className="size-3.5" />
          GitHub
        </a>

        {html && (
          <button
            type="button"
            onClick={onDownload}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Download className="size-3.5" />
            Tải HTML
          </button>
        )}

        <Link
          to={editPath}
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          <Edit className="size-3.5" />
          Chỉnh sửa
        </Link>
      </div>

      {html ? (
        <iframe
          srcDoc={html}
          className="flex-1 w-full border-0 min-h-0"
          title="HTML Preview"
          sandbox="allow-same-origin"
        />
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-6">
          <p className="text-xs text-destructive">
            Không thể hiển thị file này ở dạng HTML. File có thể không đúng định
            dạng user story.
          </p>
        </div>
      )}

      {siblingFiles.length > 0 && (
        <div className="flex shrink-0 items-stretch border-t border-border bg-muted/10 overflow-x-auto min-h-8">
          <Link
            to={`/stories${folderPath ? `?folder=${encodeURIComponent(folderPath)}` : ""}`}
            title="Tạo user story mới"
            className="flex shrink-0 items-center justify-center border-r border-border px-3 text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
          >
            <Plus className="size-3.5" />
          </Link>

          {siblingFiles.map((file) => {
            const isActive = file.name === currentFileName;
            const isRenaming = renamingFile === file.name;
            return (
              <ContextMenu key={file.path}>
                <ContextMenuTrigger className="contents">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isRenaming) navigate(`/view/${file.path}`);
                    }}
                    className={cn(
                      "cursor-pointer flex shrink-0 items-center gap-1.5 border-r border-border px-4 py-2 text-xs whitespace-nowrap transition-colors",
                      isActive
                        ? "bg-background font-semibold text-primary shadow-[inset_0_2px_0_0_hsl(var(--primary))]"
                        : "text-foreground/60 hover:bg-muted/30 hover:text-foreground",
                    )}
                  >
                    <FileText className="size-3 shrink-0" />
                    {isRenaming ? (
                      <input
                        className="select-text bg-transparent outline-none min-w-0 w-28"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitFileRename(file);
                          if (e.key === "Escape") setRenamingFile(null);
                          e.stopPropagation();
                        }}
                        onBlur={() => commitFileRename(file)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      file.name.replace(/\.md$/i, "")
                    )}
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => {
                      setRenamingFile(file.name);
                      setRenameValue(file.name.replace(/\.md$/i, ""));
                    }}
                  >
                    Đổi tên
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      )}
    </div>
  );
}
