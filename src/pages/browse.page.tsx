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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROOT_DIR } from "@/lib/github";
import {
  messageFor,
  useDeleteFile,
  useDeleteFolder,
  useDir,
  useFile,
  useRegenerateSitemap,
  useRenameFolder,
} from "@/lib/queries";
import {
  parseSitemapMarkdown,
  sitemapPathFor,
  type SitemapEntry,
} from "@/lib/sitemap";
import { cn } from "@/lib/utils";
import { useAuthorStore } from "@/store";
import {
  ExternalLink,
  Folder,
  History,
  PencilIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const COLUMNS: { key: string; label: string; className?: string }[] = [
  { key: "id", label: "ID", className: "w-28" },
  { key: "story", label: "Story", className: "min-w-[220px]" },
  { key: "sprint", label: "Sprint", className: "w-16 text-center" },
  { key: "priority", label: "Priority", className: "w-20" },
  { key: "status", label: "Status", className: "w-24" },
  { key: "assignee", label: "Assignee", className: "w-96" },
  { key: "creator", label: "Creator", className: "w-28" },
];

function useSplat() {
  const { "*": rest = "" } = useParams();
  return rest.replace(/^\/+|\/+$/g, "");
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <TableRow>
      <TableCell className="select-none border border-border/40 px-2 py-1.5 text-center text-[10px] text-muted-foreground/40">
        {index}
      </TableCell>
      {COLUMNS.map((col) => (
        <TableCell key={col.key} className="border border-border/40 px-2 py-1.5">
          <div className="h-3 animate-pulse rounded bg-muted" />
        </TableCell>
      ))}
      <TableCell className="border border-border/40 px-2 py-1.5" />
    </TableRow>
  );
}

function EntryRow({
  entry,
  index,
  onDelete,
  deleting,
}: {
  entry: SitemapEntry;
  index: number;
  onDelete: (entry: SitemapEntry) => void;
  deleting: boolean;
}) {
  const navigate = useNavigate();
  return (
    <TableRow
      className="cursor-pointer hover:bg-primary/5"
      onClick={() => navigate(`/view/${entry.path}`)}
    >
      <TableCell className="select-none border border-border/40 px-2 py-1.5 text-center text-[10px] text-muted-foreground/50">
        {index}
      </TableCell>
      <TableCell className="border border-border/40 px-2 py-1.5 font-medium text-primary">
        {entry.id}
      </TableCell>
      <TableCell className="max-w-[280px] truncate border border-border/40 px-2 py-1.5">
        {entry.story}
      </TableCell>
      <TableCell className="border border-border/40 px-2 py-1.5 text-center">
        {entry.sprint}
      </TableCell>
      <TableCell className="border border-border/40 px-2 py-1.5">
        {entry.priority}
      </TableCell>
      <TableCell className="border border-border/40 px-2 py-1.5">
        {entry.status}
      </TableCell>
      <TableCell className="border border-border/40 px-2 py-1.5">
        {entry.assignee}
      </TableCell>
      <TableCell className="border border-border/40 px-2 py-1.5">
        {entry.creator}
      </TableCell>
      <TableCell className="border border-border/40 px-2 py-1.5 text-center">
        <button
          type="button"
          aria-label={`Xoá ${entry.id}`}
          title="Xoá"
          disabled={deleting}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry);
          }}
          className="inline-flex items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="size-3.5" />
        </button>
      </TableCell>
    </TableRow>
  );
}

function FolderTable({ folder }: { folder: string }) {
  const author = useAuthorStore((s) => s.name);
  const path = sitemapPathFor(folder);
  const { data, isPending, error, refetch } = useFile(path);
  const regen = useRegenerateSitemap();
  const regenError = regen.error ? messageFor(regen.error) : null;
  const regenerating = regen.isPending;

  const del = useDeleteFile();
  const [pendingDelete, setPendingDelete] = useState<SitemapEntry | null>(null);
  const deleteError = del.error ? messageFor(del.error) : null;

  const entries = data?.content ? parseSitemapMarkdown(data.content) : [];

  const onGenerate = async () => {
    if (!author) return;
    try {
      await regen.mutateAsync({ folder, websiteUser: author });
      await refetch();
    } catch {
      /* handled via regen.error */
    }
  };

  const onConfirmDelete = async () => {
    if (!author || !pendingDelete) return;
    const target = pendingDelete;
    try {
      await del.mutateAsync({
        path: target.path,
        message: `Delete ${target.path} via web`,
        websiteUser: author,
      });
      setPendingDelete(null);
    } catch {
      /* handled via del.error */
    }
  };

  return (
    <>
      {data && (
        <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/10 px-4 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Sitemap · {entries.length} mục
          </span>
          <div className="flex items-center gap-2">
            {regenError && (
              <span className="text-[10px] text-destructive">{regenError}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={onGenerate}
              disabled={!author || regenerating}
            >
              {regenerating && <Spinner className="size-3" />}
              Cập nhật
            </Button>
            <a
              href={data.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
            >
              {path}
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      )}

      <Table className="border-collapse">
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-muted/60">
            <TableHead className="h-auto w-8 border border-border/60 px-2 py-1.5 font-normal text-muted-foreground" />
            {COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  "h-auto border border-border/60 px-2 py-1.5 font-medium text-muted-foreground",
                  col.className,
                )}
              >
                {col.label}
              </TableHead>
            ))}
            <TableHead className="h-auto w-10 border border-border/60 px-2 py-1.5 font-normal text-muted-foreground" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending &&
            Array.from({ length: 3 }, (_, i) => (
              <SkeletonRow key={i} index={i + 1} />
            ))}

          {!isPending && error && (
            <TableRow>
              <TableCell
                colSpan={COLUMNS.length + 2}
                className="px-4 py-6 text-center text-xs text-destructive"
              >
                {messageFor(error)}
              </TableCell>
            </TableRow>
          )}

          {!isPending && !error && !data && (
            <TableRow>
              <TableCell
                colSpan={COLUMNS.length + 2}
                className="px-4 py-10 text-center text-xs"
              >
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <p>Chưa có sitemap cho thư mục này.</p>
                  <Button
                    size="sm"
                    onClick={onGenerate}
                    disabled={!author || regenerating}
                  >
                    {regenerating && <Spinner className="size-3.5" />}
                    Tạo sitemap
                  </Button>
                  {!author && (
                    <p className="text-destructive">
                      Cần đặt tên hiển thị (góc trên bên phải) trước khi tạo.
                    </p>
                  )}
                  {regenError && (
                    <p className="text-destructive">{regenError}</p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}

          {!isPending && data && entries.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={COLUMNS.length + 2}
                className="px-4 py-10 text-center text-xs text-muted-foreground"
              >
                Thư mục trống.{" "}
                <Link to="/convert" className="text-primary hover:underline">
                  Tạo user story mới
                </Link>
              </TableCell>
            </TableRow>
          )}

          {entries.map((entry, i) => (
            <EntryRow
              key={entry.path}
              entry={entry}
              index={i + 1}
              onDelete={setPendingDelete}
              deleting={del.isPending && pendingDelete?.path === entry.path}
            />
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !del.isPending) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá file này?</AlertDialogTitle>
            <AlertDialogDescription>
              Xoá <code>{pendingDelete?.path}</code> khỏi nhánh. Hành động này
              tạo một commit và không thể hoàn tác từ giao diện.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-xs text-destructive">{deleteError}</p>
          )}
          {!author && (
            <p className="text-xs text-destructive">
              Cần đặt tên hiển thị (góc trên bên phải) trước khi xoá.
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={del.isPending || !author}
            >
              {del.isPending && <Spinner className="size-3.5" />}
              Xoá vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function BrowsePage() {
  const path = useSplat();
  const navigate = useNavigate();
  const authorName = useAuthorStore((s) => s.name);
  const renameFolderMutation = useRenameFolder();
  const deleteFolderMutation = useDeleteFolder();
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<string | null>(
    null,
  );
  const folderDeleteError = deleteFolderMutation.error
    ? messageFor(deleteFolderMutation.error)
    : null;
  const commitFolderRename = () => {
    const trimmed = renameValue.trim();
    const old = renamingFolder;
    setRenamingFolder(null);
    if (!old || !trimmed || trimmed === old) return;
    renameFolderMutation.mutate(
      { oldFolder: old, newFolder: trimmed, websiteUser: authorName },
      { onSuccess: () => navigate(`/browse/${trimmed}`) },
    );
  };

  const onConfirmDeleteFolder = async () => {
    if (!authorName || !pendingDeleteFolder) return;
    const target = pendingDeleteFolder;
    try {
      await deleteFolderMutation.mutateAsync({
        folder: target,
        websiteUser: authorName,
      });
      setPendingDeleteFolder(null);
      navigate(`/browse`);
    } catch {
      /* handled via deleteFolderMutation.error */
    }
  };

  const {
    data: rootEntries,
    error: rootError,
    refetch,
    isFetching,
  } = useDir("");

  const rootFolders = (rootEntries ?? []).filter((e) => e.type === "dir");

  // Active tab: first path segment from URL, else first root folder
  const urlFolder = path.split("/").filter(Boolean)[0] ?? "";
  const activeTab = urlFolder || rootFolders[0]?.name || "";

  const currentPath = [ROOT_DIR, activeTab].filter(Boolean).join("/");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">
          {currentPath || "root"}
        </span>
        <div className="flex items-center gap-2">
          {rootError && (
            <span className="text-xs text-destructive">
              {messageFor(rootError)}
            </span>
          )}
          <Link
            to={`/history${activeTab ? `?path=${encodeURIComponent(activeTab)}` : ""}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <History className="size-3.5" />
            Lịch sử
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Tải lại
          </Button>
        </div>
      </div>

      {/* Sitemap-driven table */}
      <div className="flex-1 overflow-auto">
        {activeTab ? (
          <FolderTable folder={activeTab} />
        ) : (
          <div className="px-4 py-10 text-center text-xs text-muted-foreground">
            Chưa có thư mục nào.{" "}
            <Link to="/convert" className="text-primary hover:underline">
              Tạo user story mới
            </Link>
          </div>
        )}
      </div>

      {/* Bottom sheet tabs — Google Sheets style */}
      <div className="flex shrink-0 items-stretch border-t border-border bg-muted/10 overflow-x-auto min-h-8">
        <Link
          to={`/convert${activeTab ? `?folder=${encodeURIComponent(activeTab)}` : ""}`}
          title="Tạo user story mới"
          className="flex shrink-0 items-center justify-center border-r border-border px-3 text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
        >
          <Plus className="size-3.5" />
        </Link>

        {rootFolders.map((folder) => {
          const isActive = activeTab === folder.name;
          const isRenaming = renamingFolder === folder.name;

          return (
            <ContextMenu key={folder.path}>
              <ContextMenuTrigger className="contents">
                <button
                  type="button"
                  onClick={() => {
                    if (!isRenaming) navigate(`/browse/${folder.name}`);
                  }}
                  className={cn(
                    "cursor-pointer flex shrink-0 items-center gap-1.5 border-r border-border px-4 py-2 text-xs whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-background font-semibold text-primary shadow-[inset_0_2px_0_0_hsl(var(--primary))]"
                      : "text-foreground/60 hover:bg-muted/30 hover:text-foreground",
                  )}
                >
                  <Folder className="size-3 shrink-0" />
                  {isRenaming ? (
                    <input
                      className="select-text bg-transparent outline-none min-w-0 w-24"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitFolderRename();
                        if (e.key === "Escape") setRenamingFolder(null);
                        e.stopPropagation();
                      }}
                      onBlur={commitFolderRename}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    folder.name
                  )}
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() => {
                    setRenamingFolder(folder.name);
                    setRenameValue(folder.name);
                  }}
                >
                  <PencilIcon className="size-3.5 text-muted-foreground/75" />
                  Đổi tên
                </ContextMenuItem>
                <ContextMenuItem
                  variant="destructive"
                  onClick={() => setPendingDeleteFolder(folder.name)}
                >
                  <Trash2 className="size-3.5" />
                  Xoá
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>

      <AlertDialog
        open={pendingDeleteFolder !== null}
        onOpenChange={(open) => {
          if (!open && !deleteFolderMutation.isPending)
            setPendingDeleteFolder(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá thư mục này?</AlertDialogTitle>
            <AlertDialogDescription>
              Xoá thư mục <code>{pendingDeleteFolder}</code> cùng toàn bộ file
              bên trong. Hành động này tạo một commit và không thể hoàn tác từ
              giao diện.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {folderDeleteError && (
            <p className="text-xs text-destructive">{folderDeleteError}</p>
          )}
          {!authorName && (
            <p className="text-xs text-destructive">
              Cần đặt tên hiển thị (góc trên bên phải) trước khi xoá.
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteFolderMutation.isPending}>
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={onConfirmDeleteFolder}
              disabled={deleteFolderMutation.isPending || !authorName}
            >
              {deleteFolderMutation.isPending && (
                <Spinner className="size-3.5" />
              )}
              Xoá vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
