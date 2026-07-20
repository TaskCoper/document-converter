import { buttonVariants } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  fromRuleMarkdown,
  toRuleHtml,
} from "@/features/business-rules/exporters";
import { RuleStatusLabel } from "@/features/business-rules/validations";
import { fromTddMarkdown, toTddHtml } from "@/features/tdds/exporters";
import { TddDocumentView } from "@/features/tdds/components/tdd-document-view";
import { fromMarkdown, toHtml } from "@/features/user-stories/exporters";
import { useAuthorStore } from "@/features/user-stories/store";
import { detectType, type FileType } from "@/lib/file-type";
import { useDir } from "@/hooks/use-dir";
import { useFile } from "@/hooks/use-file";
import { useRenameFile } from "@/hooks/use-rename-file";
import { messageFor, parentOf } from "@/lib/github";
import { isSitemapPath } from "@/lib/sitemap";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Columns2,
  Edit,
  ExternalLink,
  FileText,
  Plus,
  Rows2,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

function renderMarkdownToHtml(
  md: string,
  type: FileType | null,
): string | null {
  try {
    if (type === "tdd") return toTddHtml(fromTddMarkdown(md));
    if (type === "business-rule") return toRuleHtml(fromRuleMarkdown(md));
    return toHtml(fromMarkdown(md));
  } catch {
    return null;
  }
}

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

  const detectedType = data?.content ? detectType(data.content) : null;
  const html = data?.content
    ? renderMarkdownToHtml(data.content, detectedType)
    : null;

  let storyTdds: { id: string; path: string }[] = [];
  let storyRules: { id: string; path: string }[] = [];
  if (detectedType === "user-story" && data?.content) {
    try {
      const parsed = fromMarkdown(data.content);
      storyTdds = parsed.references.tdds;
      storyRules = parsed.references.rules;
    } catch {
      storyTdds = [];
      storyRules = [];
    }
  }

  let tddParsed: ReturnType<typeof fromTddMarkdown> | null = null;
  if (detectedType === "tdd" && data?.content) {
    try {
      tddParsed = fromTddMarkdown(data.content);
    } catch {
      tddParsed = null;
    }
  }

  const canSplit = detectedType === "user-story" && storyTdds.length > 0;
  const canShowRules = detectedType === "user-story" && storyRules.length > 0;
  const [tddsOpen, setTddsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const showTdds = canSplit && tddsOpen;
  const showRules = canShowRules && rulesOpen;
  const showExtras = showTdds || showRules;

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

  // const onDownload = () => {
  //   if (!html) return;
  //   const filename =
  //     path.split("/").pop()?.replace(/\.md$/, ".html") ?? "view.html";
  //   const blob = new Blob([html], { type: "text/html" });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = filename;
  //   a.click();
  //   URL.revokeObjectURL(url);
  // };

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
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

        {canSplit && (
          <button
            type="button"
            onClick={() => setTddsOpen((v) => !v)}
            aria-pressed={tddsOpen}
            className={buttonVariants({
              variant: tddsOpen ? "default" : "outline",
              size: "sm",
            })}
          >
            <Columns2 className="size-3.5" />
            {tddsOpen ? "Ẩn TDDs" : "Xem TDDs"}
          </button>
        )}

        {canShowRules && (
          <button
            type="button"
            onClick={() => setRulesOpen((v) => !v)}
            aria-pressed={rulesOpen}
            className={buttonVariants({
              variant: rulesOpen ? "default" : "outline",
              size: "sm",
            })}
          >
            <Rows2 className="size-3.5" />
            {rulesOpen ? "Ẩn Rules" : "Xem Rules"}
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
        <div className="flex-1 min-h-0 overflow-hidden">
          {showExtras ? (
            showTdds && showRules ? (
              <ResizablePanelGroup orientation="horizontal" className="h-full">
                <ResizablePanel defaultSize={70} minSize={20}>
                  <ResizablePanelGroup
                    orientation="vertical"
                    className="h-full"
                  >
                    <ResizablePanel defaultSize={80} minSize={15}>
                      <iframe
                        srcDoc={html}
                        className="w-full h-full border-0"
                        title="Story preview"
                        sandbox="allow-same-origin allow-top-navigation-by-user-activation"
                      />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={20} minSize={15}>
                      <BusinessRulesTable rules={storyRules} />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={30} minSize={20}>
                  {storyTdds.length === 1 ? (
                    <TddPreviewPanel
                      path={storyTdds[0].path}
                      id={storyTdds[0].id}
                    />
                  ) : (
                    <ResizablePanelGroup
                      orientation="horizontal"
                      className="h-full"
                    >
                      {storyTdds.map((tdd, i) => (
                        <Fragment key={tdd.path}>
                          {i > 0 && <ResizableHandle withHandle />}
                          <ResizablePanel
                            defaultSize={100 / storyTdds.length}
                            minSize={15}
                          >
                            <TddPreviewPanel path={tdd.path} id={tdd.id} />
                          </ResizablePanel>
                        </Fragment>
                      ))}
                    </ResizablePanelGroup>
                  )}
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : showTdds ? (
              <ResizablePanelGroup orientation="horizontal" className="h-full">
                <ResizablePanel defaultSize={70} minSize={20}>
                  <iframe
                    srcDoc={html}
                    className="w-full h-full border-0"
                    title="Story preview"
                    sandbox="allow-same-origin allow-top-navigation-by-user-activation"
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={30} minSize={20}>
                  {storyTdds.length === 1 ? (
                    <TddPreviewPanel
                      path={storyTdds[0].path}
                      id={storyTdds[0].id}
                    />
                  ) : (
                    <ResizablePanelGroup
                      orientation="horizontal"
                      className="h-full"
                    >
                      {storyTdds.map((tdd, i) => (
                        <Fragment key={tdd.path}>
                          {i > 0 && <ResizableHandle withHandle />}
                          <ResizablePanel
                            defaultSize={100 / storyTdds.length}
                            minSize={15}
                          >
                            <TddPreviewPanel path={tdd.path} id={tdd.id} />
                          </ResizablePanel>
                        </Fragment>
                      ))}
                    </ResizablePanelGroup>
                  )}
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <ResizablePanelGroup orientation="vertical" className="h-full">
                <ResizablePanel defaultSize={80} minSize={15}>
                  <iframe
                    srcDoc={html}
                    className="w-full h-full border-0"
                    title="Story preview"
                    sandbox="allow-same-origin allow-top-navigation-by-user-activation"
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={20} minSize={15}>
                  <BusinessRulesTable rules={storyRules} />
                </ResizablePanel>
              </ResizablePanelGroup>
            )
          ) : detectedType === "tdd" && tddParsed ? (
            <div className="h-full overflow-y-auto p-8">
              <div className="mx-auto max-w-3xl">
                <TddDocumentView data={tddParsed} />
              </div>
            </div>
          ) : (
            <iframe
              srcDoc={html}
              className="w-full h-full border-0"
              title="Story preview"
              sandbox="allow-same-origin allow-top-navigation-by-user-activation"
            />
          )}
        </div>
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

function TddPreviewPanel({ path, id }: { path: string; id: string }) {
  const { data: fileData, isPending, error } = useFile(path);

  let parsed: ReturnType<typeof fromTddMarkdown> | null = null;
  if (fileData?.content) {
    try {
      parsed = fromTddMarkdown(fileData.content);
    } catch {
      parsed = null;
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 flex items-center gap-2 border-b border-border bg-muted/20 px-2 py-1.5">
        <FileText className="size-3 shrink-0 text-muted-foreground" />
        <code className="truncate text-xs font-mono flex-1">{id}</code>
        <Link
          to={`/view/${path}`}
          title="Mở trong tab riêng"
          className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-3" />
        </Link>
      </div>

      {isPending ? (
        <p className="p-3 text-xs text-muted-foreground">Đang tải TDD…</p>
      ) : error ? (
        <p className="p-3 text-xs text-destructive">{messageFor(error)}</p>
      ) : !fileData ? (
        <p className="p-3 text-xs text-destructive">
          Không tìm thấy <code>{path}</code>.
        </p>
      ) : !parsed ? (
        <p className="p-3 text-xs text-destructive">
          Không thể hiển thị TDD này.
        </p>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          <TddDocumentView data={parsed} />
        </div>
      )}
    </div>
  );
}

const RULE_COLUMNS: { key: string; label: string; minWidth?: string }[] = [
  { key: "id", label: "Rule ID" },
  { key: "name", label: "Tên rule", minWidth: "180px" },
  { key: "category", label: "Danh mục", minWidth: "140px" },
  { key: "statement", label: "Phát biểu (Statement)", minWidth: "320px" },
  { key: "when", label: "Điều kiện (When)", minWidth: "220px" },
  { key: "then", label: "Hành vi (Then)", minWidth: "260px" },
  { key: "except", label: "Ngoại lệ (Except)", minWidth: "220px" },
  { key: "source", label: "Nguồn", minWidth: "180px" },
  { key: "owner", label: "Người sở hữu", minWidth: "140px" },
  { key: "relatedStories", label: "Story liên quan", minWidth: "160px" },
  { key: "status", label: "Trạng thái" },
  { key: "version", label: "Version" },
  { key: "effectiveDate", label: "Ngày hiệu lực" },
  { key: "notes", label: "Ghi chú / Link logic", minWidth: "220px" },
];

function BusinessRulesTable({
  rules,
}: {
  rules: { id: string; path: string }[];
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden p-3">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-[10px]">
          <thead>
            <tr>
              {RULE_COLUMNS.map((c) => (
                <th
                  key={c.key}
                  style={c.minWidth ? { minWidth: c.minWidth } : undefined}
                  className="sticky top-0 text-xs z-10 border-b border-r border-[#d9d5cc] bg-[#e8a13a] px-2 py-1.5 text-center font-bold text-white whitespace-nowrap"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.map((r, i) => (
              <BusinessRuleRow key={r.path} rule={r} zebra={i % 2 === 1} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BusinessRuleRow({
  rule,
  zebra,
}: {
  rule: { id: string; path: string };
  zebra: boolean;
}) {
  const { data, isPending, error } = useFile(rule.path);

  let parsed: ReturnType<typeof fromRuleMarkdown> | null = null;
  if (data?.content) {
    try {
      parsed = fromRuleMarkdown(data.content);
    } catch {
      parsed = null;
    }
  }

  const cellBg = zebra ? "bg-[#f3f1ea]" : "bg-white";
  const cellBase =
    "border-b border-r border-[#d9d5cc] px-2 py-1.5 align-top text-xs text-[#111827]";
  const idCell =
    "border-b border-r border-[#d9d5cc] bg-[#fbe7cc] px-2 py-1.5 align-top font-mono text-[10px] font-semibold text-[#92400e] whitespace-nowrap";

  if (isPending) {
    return (
      <tr>
        <td className={idCell}>
          <Link to={`/view/${rule.path}`} className="hover:underline">
            {rule.id}
          </Link>
        </td>
        <td
          colSpan={RULE_COLUMNS.length - 1}
          className={cn(cellBase, cellBg, "text-muted-foreground")}
        >
          Đang tải…
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr>
        <td className={idCell}>{rule.id}</td>
        <td
          colSpan={RULE_COLUMNS.length - 1}
          className={cn(cellBase, cellBg, "text-destructive")}
        >
          {messageFor(error)}
        </td>
      </tr>
    );
  }

  if (!data || !parsed) {
    return (
      <tr>
        <td className={idCell}>{rule.id}</td>
        <td
          colSpan={RULE_COLUMNS.length - 1}
          className={cn(cellBase, cellBg, "text-destructive")}
        >
          Không đọc được rule tại <code>{rule.path}</code>
        </td>
      </tr>
    );
  }

  const wrap = "whitespace-normal break-words";
  const nowrap = "whitespace-nowrap";
  const center = "text-center";

  return (
    <tr>
      <td className={idCell}>
        <Link to={`/view/${rule.path}`} className="text-xs hover:underline">
          {parsed.ruleId || rule.id}
        </Link>
      </td>
      <td className={cn(cellBase, cellBg, wrap)}>{parsed.name}</td>
      <td className={cn(cellBase, cellBg, center)}>{parsed.category}</td>
      <td className={cn(cellBase, cellBg, wrap)}>{parsed.statement}</td>
      <td className={cn(cellBase, cellBg, wrap)}>{parsed.when}</td>
      <td className={cn(cellBase, cellBg, wrap)}>{parsed.then}</td>
      <td className={cn(cellBase, cellBg, wrap)}>{parsed.except}</td>
      <td className={cn(cellBase, cellBg, wrap)}>{parsed.source}</td>
      <td className={cn(cellBase, cellBg)}>{parsed.owner}</td>
      <td className={cn(cellBase, cellBg, wrap)}>
        {parsed.relatedStories.join(", ")}
      </td>
      <td className={cn(cellBase, cellBg, center, nowrap)}>
        {RuleStatusLabel[parsed.status]}
      </td>
      <td className={cn(cellBase, cellBg, center, nowrap)}>{parsed.version}</td>
      <td className={cn(cellBase, cellBg, center, nowrap)}>
        {parsed.effectiveDate}
      </td>
      <td className={cn(cellBase, cellBg, wrap)}>{parsed.notes}</td>
    </tr>
  );
}
