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
import { useDeleteFile } from "@/hooks/use-delete-file";
import { useDeleteFolder } from "@/hooks/use-delete-folder";
import { useDir } from "@/hooks/use-dir";
import { useFile } from "@/hooks/use-file";
import { useRegenerateSitemap } from "@/hooks/use-regenerate-sitemap";
import { useRenameFolder } from "@/hooks/use-rename-folder";
import { ROOT_DIR, messageFor } from "@/lib/github";
import {
  parseSitemapMarkdown,
  sitemapPathFor,
  type RuleSitemapEntry,
  type SitemapEntry,
  type StorySitemapEntry,
  type TddSitemapEntry,
} from "@/lib/sitemap";
import { cn } from "@/lib/utils";
import { useAuthorStore } from "@/features/user-stories/store";
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

type ColumnDef<T extends SitemapEntry> = {
  key: string;
  label: string;
  className?: string;
  cellClassName?: string;
  render: (entry: T) => React.ReactNode;
};

const STORY_COLUMNS: ColumnDef<StorySitemapEntry>[] = [
  {
    key: "id",
    label: "ID",
    className: "w-28",
    cellClassName: "font-medium text-primary",
    render: (e) => e.id,
  },
  {
    key: "story",
    label: "Story",
    className: "min-w-[220px]",
    cellClassName: "max-w-[280px] truncate",
    render: (e) => e.story,
  },
  {
    key: "sprint",
    label: "Sprint",
    className: "w-16 text-center",
    cellClassName: "text-center",
    render: (e) => e.sprint,
  },
  { key: "priority", label: "Priority", className: "w-20", render: (e) => e.priority },
  { key: "status", label: "Status", className: "w-24", render: (e) => e.status },
  { key: "assignee", label: "Assignee", className: "w-96", render: (e) => e.assignee },
  { key: "creator", label: "Creator", className: "w-28", render: (e) => e.creator },
];

const TDD_COLUMNS: ColumnDef<TddSitemapEntry>[] = [
  {
    key: "id",
    label: "ID",
    className: "w-32",
    cellClassName: "font-medium text-primary",
    render: (e) => e.id,
  },
  {
    key: "feature",
    label: "Feature",
    className: "min-w-[220px]",
    cellClassName: "max-w-[280px] truncate",
    render: (e) => e.feature,
  },
  { key: "status", label: "Status", className: "w-24", render: (e) => e.status },
  { key: "version", label: "Version", className: "w-20", render: (e) => e.version },
  { key: "author", label: "Author", className: "w-40", render: (e) => e.author },
  { key: "reviewer", label: "Reviewer", className: "w-40", render: (e) => e.reviewer },
  { key: "updatedAt", label: "Updated", className: "w-28", render: (e) => e.updatedAt },
];

const RULE_COLUMNS: ColumnDef<RuleSitemapEntry>[] = [
  {
    key: "id",
    label: "Rule ID",
    className: "w-24",
    cellClassName: "font-medium text-primary",
    render: (e) => e.id,
  },
  {
    key: "name",
    label: "Tên rule",
    className: "min-w-[220px]",
    cellClassName: "max-w-[280px] truncate",
    render: (e) => e.name,
  },
  { key: "category", label: "Danh mục", className: "w-32", render: (e) => e.category },
  { key: "status", label: "Status", className: "w-24", render: (e) => e.status },
  { key: "version", label: "Version", className: "w-20", render: (e) => e.version },
  { key: "owner", label: "Owner", className: "w-40", render: (e) => e.owner },
  {
    key: "effectiveDate",
    label: "Hiệu lực",
    className: "w-28",
    render: (e) => e.effectiveDate,
  },
];

function useSplat() {
  const { "*": rest = "" } = useParams();
  return rest.replace(/^\/+|\/+$/g, "");
}

function SkeletonRow<T extends SitemapEntry>({
  index,
  columns,
}: {
  index: number;
  columns: ColumnDef<T>[];
}) {
  return (
    <TableRow>
      <TableCell className="select-none border border-border/40 px-2 py-1.5 text-center text-[10px] text-muted-foreground/40">
        {index}
      </TableCell>
      {columns.map((col) => (
        <TableCell
          key={col.key}
          className="border border-border/40 px-2 py-1.5"
        >
          <div className="h-3 animate-pulse rounded bg-muted" />
        </TableCell>
      ))}
      <TableCell className="border border-border/40 px-2 py-1.5" />
    </TableRow>
  );
}

function EntryRow<T extends SitemapEntry>({
  entry,
  index,
  columns,
  onDelete,
  deleting,
}: {
  entry: T;
  index: number;
  columns: ColumnDef<T>[];
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
      {columns.map((col) => (
        <TableCell
          key={col.key}
          className={cn(
            "border border-border/40 px-2 py-1.5",
            col.cellClassName,
          )}
        >
          {col.render(entry)}
        </TableCell>
      ))}
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

function EntriesTable<T extends SitemapEntry>({
  title,
  columns,
  entries,
  onDelete,
  deletingPath,
  isDeleting,
}: {
  title?: string;
  columns: ColumnDef<T>[];
  entries: T[];
  onDelete: (entry: SitemapEntry) => void;
  deletingPath: string | undefined;
  isDeleting: boolean;
}) {
  return (
    <>
      {title && (
        <div className="border-b border-border/60 bg-muted/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </div>
      )}
      <Table className="border-collapse">
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-muted/60">
            <TableHead className="h-auto w-8 border border-border/60 px-2 py-1.5 font-normal text-muted-foreground" />
            {columns.map((col) => (
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
          {entries.map((entry, i) => (
            <EntryRow
              key={entry.path}
              entry={entry}
              index={i + 1}
              columns={columns}
              onDelete={onDelete}
              deleting={isDeleting && deletingPath === entry.path}
            />
          ))}
        </TableBody>
      </Table>
    </>
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
  const storyEntries = entries.filter(
    (e): e is StorySitemapEntry => e.type === "user-story",
  );
  const tddEntries = entries.filter(
    (e): e is TddSitemapEntry => e.type === "tdd",
  );
  const ruleEntries = entries.filter(
    (e): e is RuleSitemapEntry => e.type === "business-rule",
  );
  const sectionCount =
    (storyEntries.length > 0 ? 1 : 0) +
    (tddEntries.length > 0 ? 1 : 0) +
    (ruleEntries.length > 0 ? 1 : 0);
  const hasMixed = sectionCount > 1;

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

      {isPending && (
        <Table className="border-collapse">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="bg-muted/60">
              <TableHead className="h-auto w-8 border border-border/60 px-2 py-1.5 font-normal text-muted-foreground" />
              {STORY_COLUMNS.map((col) => (
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
            {Array.from({ length: 3 }, (_, i) => (
              <SkeletonRow key={i} index={i + 1} columns={STORY_COLUMNS} />
            ))}
          </TableBody>
        </Table>
      )}

      {!isPending && error && (
        <p className="px-4 py-6 text-center text-xs text-destructive">
          {messageFor(error)}
        </p>
      )}

      {!isPending && !error && !data && (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-xs text-muted-foreground">
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
          {regenError && <p className="text-destructive">{regenError}</p>}
        </div>
      )}

      {!isPending && data && entries.length === 0 && (
        <p className="px-4 py-10 text-center text-xs text-muted-foreground">
          Thư mục trống.{" "}
          <Link to="/stories" className="text-primary hover:underline">
            Tạo user story mới
          </Link>
        </p>
      )}

      {storyEntries.length > 0 && (
        <EntriesTable
          title={hasMixed ? "User Stories" : undefined}
          columns={STORY_COLUMNS}
          entries={storyEntries}
          onDelete={setPendingDelete}
          deletingPath={pendingDelete?.path}
          isDeleting={del.isPending}
        />
      )}

      {tddEntries.length > 0 && (
        <EntriesTable
          title={hasMixed ? "Technical Design Docs" : undefined}
          columns={TDD_COLUMNS}
          entries={tddEntries}
          onDelete={setPendingDelete}
          deletingPath={pendingDelete?.path}
          isDeleting={del.isPending}
        />
      )}

      {ruleEntries.length > 0 && (
        <EntriesTable
          title={hasMixed ? "Business Rules" : undefined}
          columns={RULE_COLUMNS}
          entries={ruleEntries}
          onDelete={setPendingDelete}
          deletingPath={pendingDelete?.path}
          isDeleting={del.isPending}
        />
      )}

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

  const { data: activeSitemapData } = useFile(
    activeTab ? sitemapPathFor(activeTab) : "",
    !!activeTab,
  );
  const activeSitemapEntries = activeSitemapData?.content
    ? parseSitemapMarkdown(activeSitemapData.content)
    : [];
  const addTarget = (() => {
    const hasStory = activeSitemapEntries.some((e) => e.type === "user-story");
    const hasTdd = activeSitemapEntries.some((e) => e.type === "tdd");
    const hasRule = activeSitemapEntries.some((e) => e.type === "business-rule");
    const folderParam = activeTab ? `?folder=${encodeURIComponent(activeTab)}` : "";
    if (!hasStory && hasTdd && !hasRule) return `/tdd${folderParam}`;
    if (!hasStory && !hasTdd && hasRule) return `/rules${folderParam}`;
    return `/stories${folderParam}`;
  })();

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
            <Link to="/stories" className="text-primary hover:underline">
              Tạo user story mới
            </Link>
          </div>
        )}
      </div>

      {/* Bottom sheet tabs — Google Sheets style */}
      <div className="flex shrink-0 items-stretch border-t border-border bg-muted/10 overflow-x-auto min-h-8">
        <Link
          to={addTarget}
          title="Tạo mới"
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
