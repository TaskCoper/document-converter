import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TddDocumentView } from "@/features/tdds/components/tdd-document-view";
import { fromTddMarkdown } from "@/features/tdds/exporters";
import type { TddSchema } from "@/features/tdds/validations";
import { fromRuleMarkdown } from "@/features/business-rules/exporters";
import {
  RuleStatusLabel,
  type RuleSchema,
} from "@/features/business-rules/validations";
import { useFile } from "@/hooks/use-file";
import { useMediaQuery } from "@/hooks/use-media-query";
import { messageFor } from "@/lib/github";
import { cn } from "@/lib/utils";
import { ExternalLink, FileText } from "lucide-react";
import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * Khung hiển thị HTML "waffle" của Story trong một iframe (cách ly style). Iframe tự giãn cao
 * bằng đúng nội dung, còn CUỘN nằm ở div bọc ngoài (`overflow-auto`) — vì cuộn chuột ngay trên
 * iframe hay bị "lọt" xuống trang cha thay vì cuộn nội dung iframe. Nhờ vậy khi panel bị thu nhỏ
 * (mở Rules/TDD), người dùng vẫn cuộn xem hết story được.
 */
export function StoryHtmlFrame({
  html,
  title = "Story preview",
}: {
  html: string;
  title?: string;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const obsRef = useRef<ResizeObserver | null>(null);

  const fit = () => {
    const doc = ref.current?.contentDocument;
    if (ref.current && doc?.documentElement) {
      ref.current.style.height = `${doc.documentElement.scrollHeight}px`;
    }
  };

  const onLoad = () => {
    fit();
    obsRef.current?.disconnect();
    const doc = ref.current?.contentDocument;
    if (doc?.body && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => fit());
      ro.observe(doc.body);
      obsRef.current = ro;
    }
  };

  useEffect(() => () => obsRef.current?.disconnect(), []);

  return (
    <div className="h-full overflow-auto bg-white">
      <iframe
        ref={ref}
        srcDoc={html}
        title={title}
        onLoad={onLoad}
        className="block w-full border-0"
        sandbox="allow-same-origin allow-top-navigation-by-user-activation"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────
// Component trình bày CHUNG cho màn "xem story + TDD/Rule liên quan". Trước đây nằm inline
// trong view.page.tsx (chỉ chạy GitHub). Nay tách ra để CẢ view.page (GitHub, dùng `path`)
// LẪN trang chi tiết backend (dùng `parsed` đã map từ API) đều tái dùng ĐÚNG các component
// này — không mô phỏng lại.
// ─────────────────────────────────────────────────────────────────────────────────────

export interface TddRef {
  id: string;
  path?: string; // GitHub
  parsed?: TddSchema; // backend (đã map)
  href?: string; // link "mở tài liệu"
}

export interface RuleRef {
  id: string;
  path?: string;
  parsed?: RuleSchema;
  href?: string;
}

/** Bố cục split-pane: Story (chính) + panel TDD + bảng Rule, kéo chỉnh kích thước. */
export function StoryPreviewLayout({
  story,
  tdds,
  rulesPanel,
  showTdds,
  showRules,
}: {
  story: ReactNode;
  tdds: ReactNode[];
  rulesPanel: ReactNode;
  showTdds: boolean;
  showRules: boolean;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!isDesktop && (showTdds || showRules)) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <section aria-label="User Story" className="h-[75svh] min-h-96 border-b border-border">
          {story}
        </section>
        {showTdds &&
          tdds.map((panel, index) => (
            <section
              key={index}
              aria-label={`TDD liên quan ${index + 1}`}
              className="h-[75svh] min-h-96 border-b border-border"
            >
              {panel}
            </section>
          ))}
        {showRules && (
          <section
            aria-label="Business Rule liên quan"
            className="h-[75svh] min-h-96"
          >
            {rulesPanel}
          </section>
        )}
      </div>
    );
  }

  const tddPanels =
    tdds.length === 1 ? (
      tdds[0]
    ) : (
      <ResizablePanelGroup orientation="horizontal" className="h-full">
        {tdds.map((p, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <ResizableHandle
                withHandle
                aria-label="Kéo để đổi chiều rộng giữa các TDD"
              />
            )}
            <ResizablePanel
              defaultSize={`${100 / tdds.length}%`}
              minSize="15%"
            >
              {p}
            </ResizablePanel>
          </Fragment>
        ))}
      </ResizablePanelGroup>
    );

  if (showTdds && showRules) {
    return (
      <ResizablePanelGroup orientation="horizontal" className="h-full">
        <ResizablePanel defaultSize="70%" minSize="20%">
          <ResizablePanelGroup orientation="vertical" className="h-full">
            <ResizablePanel defaultSize="80%" minSize="15%">
              {story}
            </ResizablePanel>
            <ResizableHandle
              withHandle
              aria-label="Kéo để đổi chiều cao Story và Rules"
            />
            <ResizablePanel defaultSize="20%" minSize="15%">
              {rulesPanel}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle
          withHandle
          aria-label="Kéo để đổi chiều rộng Story và TDD"
        />
        <ResizablePanel defaultSize="30%" minSize="20%">
          {tddPanels}
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }
  if (showTdds) {
    return (
      <ResizablePanelGroup orientation="horizontal" className="h-full">
        <ResizablePanel defaultSize="70%" minSize="20%">
          {story}
        </ResizablePanel>
        <ResizableHandle
          withHandle
          aria-label="Kéo để đổi chiều rộng Story và TDD"
        />
        <ResizablePanel defaultSize="30%" minSize="20%">
          {tddPanels}
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }
  if (showRules) {
    return (
      <ResizablePanelGroup orientation="vertical" className="h-full">
        <ResizablePanel defaultSize="80%" minSize="15%">
          {story}
        </ResizablePanel>
        <ResizableHandle
          withHandle
          aria-label="Kéo để đổi chiều cao Story và Rules"
        />
        <ResizablePanel defaultSize="20%" minSize="15%">
          {rulesPanel}
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }
  return <>{story}</>;
}

/** Panel xem một TDD. Dual-source: `parsed` (backend) hoặc `path` (GitHub → tự fetch). */
export function TddPreviewPanel({ id, path, parsed: parsedProp, href }: TddRef) {
  const fileQuery = useFile(path ?? "", !parsedProp && !!path);

  let parsed: TddSchema | null = parsedProp ?? null;
  if (!parsed && fileQuery.data?.content) {
    try {
      parsed = fromTddMarkdown(fileQuery.data.content);
    } catch {
      parsed = null;
    }
  }

  const linkHref = href ?? (path ? `/view/${path}` : "#");
  const gitHubMode = !parsedProp;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/20 px-2 py-1.5">
        <FileText className="size-3 shrink-0 text-muted-foreground" />
        <code className="flex-1 truncate font-mono text-xs">{id}</code>
        <Link
          to={linkHref}
          title="Mở tài liệu"
          className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-3" />
        </Link>
      </div>

      {gitHubMode && fileQuery.isPending ? (
        <p className="p-3 text-xs text-muted-foreground">Đang tải TDD…</p>
      ) : gitHubMode && fileQuery.error ? (
        <p className="p-3 text-xs text-destructive">
          {messageFor(fileQuery.error)}
        </p>
      ) : !parsed ? (
        <p className="p-3 text-xs text-destructive">
          Không thể hiển thị TDD này.
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
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

export function BusinessRulesTable({ rules }: { rules: RuleRef[] }) {
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
                  className="sticky top-0 z-10 whitespace-nowrap border-b border-r border-border bg-primary px-2 py-1.5 text-center text-xs font-bold text-primary-foreground"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.map((r, i) => (
              <BusinessRuleRow key={r.id} rule={r} zebra={i % 2 === 1} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BusinessRuleRow({ rule, zebra }: { rule: RuleRef; zebra: boolean }) {
  const fileQuery = useFile(rule.path ?? "", !rule.parsed && !!rule.path);

  let parsed: RuleSchema | null = rule.parsed ?? null;
  if (!parsed && fileQuery.data?.content) {
    try {
      parsed = fromRuleMarkdown(fileQuery.data.content);
    } catch {
      parsed = null;
    }
  }

  const cellBg = zebra ? "bg-muted/40" : "bg-background";
  const cellBase =
    "border-b border-r border-border px-2 py-1.5 align-top text-xs text-foreground";
  const idCell =
    "whitespace-nowrap border-b border-r border-border bg-primary/10 px-2 py-1.5 align-top font-mono text-[10px] font-semibold text-primary";
  const linkHref = rule.href ?? (rule.path ? `/view/${rule.path}` : "#");
  const gitHubMode = !rule.parsed;

  if (gitHubMode && fileQuery.isPending) {
    return (
      <tr>
        <td className={idCell}>{rule.id}</td>
        <td
          colSpan={RULE_COLUMNS.length - 1}
          className={cn(cellBase, cellBg, "text-muted-foreground")}
        >
          Đang tải…
        </td>
      </tr>
    );
  }
  if (gitHubMode && fileQuery.error) {
    return (
      <tr>
        <td className={idCell}>{rule.id}</td>
        <td
          colSpan={RULE_COLUMNS.length - 1}
          className={cn(cellBase, cellBg, "text-destructive")}
        >
          {messageFor(fileQuery.error)}
        </td>
      </tr>
    );
  }
  if (!parsed) {
    return (
      <tr>
        <td className={idCell}>{rule.id}</td>
        <td
          colSpan={RULE_COLUMNS.length - 1}
          className={cn(cellBase, cellBg, "text-destructive")}
        >
          Không đọc được rule.
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
        <Link to={linkHref} className="text-xs hover:underline">
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
