import {
  BusinessRulesTable,
  StoryHtmlFrame,
  StoryPreviewLayout,
  TddPreviewPanel,
  type RuleRef,
} from "@/components/story-document-view";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { projectKeys } from "@/lib/query-keys";
import { useQueries } from "@tanstack/react-query";
import { Columns2, Rows2 } from "lucide-react";
import { useMemo, useState } from "react";
import { adaptRule, adaptTdd } from "../adapt-document";
import documentService from "../document-services";
import type { DocumentDetail, DocumentListRow } from "../document-types";
import { useDocument } from "../hooks/use-document";
import { useDocuments } from "../hooks/use-documents";

const REF = { UserStory: 1, Tdd: 2, BusinessRule: 3 };

// Trang chi tiết US backend tái dùng ĐÚNG bố cục + component của view.page (StoryPreviewLayout,
// TddPreviewPanel, BusinessRulesTable). Chỉ khác nguồn: TDD/Rule liên quan lấy từ content.links,
// resolve docKey→id trong project rồi fetch + map sang schema (adaptTdd/adaptRule) để đưa vào
// các component đó (chế độ `parsed`).
export function StorySplitView({
  projectId,
  doc,
  storyHtml,
}: {
  projectId: string;
  doc: DocumentDetail;
  storyHtml: string | null;
}) {
  const { documents } = useDocuments(projectId, { pageSize: 200 });
  const byKey = useMemo(() => {
    const m = new Map<string, DocumentListRow>();
    for (const d of documents) m.set(d.docKey, d);
    return m;
  }, [documents]);

  const resolve = (kind: number) =>
    doc.content.links
      .filter((l) => l.targetKind === kind)
      .map((l) => byKey.get(l.targetDocKey))
      .filter((d): d is DocumentListRow => !!d);

  const tddDocs = resolve(REF.Tdd);
  const ruleDocs = resolve(REF.BusinessRule);

  const [tddsOpen, setTddsOpen] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(true);

  const canTdds = tddDocs.length > 0;
  const canRules = ruleDocs.length > 0;
  const showTdds = canTdds && tddsOpen;
  const showRules = canRules && rulesOpen;

  const story = <StoryHtmlFrame html={storyHtml ?? ""} />;

  return (
    <div className="flex h-full flex-col gap-2">
      {(canTdds || canRules) && (
        <div className="flex shrink-0 items-center gap-2">
          {canTdds && (
            <button
              type="button"
              aria-pressed={tddsOpen}
              onClick={() => setTddsOpen((v) => !v)}
              className={buttonVariants({
                variant: tddsOpen ? "default" : "outline",
                size: "sm",
              })}
            >
              <Columns2 className="size-3.5" />
              {tddsOpen ? "Ẩn TDDs" : `Xem TDDs (${tddDocs.length})`}
            </button>
          )}
          {canRules && (
            <button
              type="button"
              aria-pressed={rulesOpen}
              onClick={() => setRulesOpen((v) => !v)}
              className={buttonVariants({
                variant: rulesOpen ? "default" : "outline",
                size: "sm",
              })}
            >
              <Rows2 className="size-3.5" />
              {rulesOpen ? "Ẩn Rules" : `Xem Rules (${ruleDocs.length})`}
            </button>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden border border-border/40">
        <StoryPreviewLayout
          showTdds={showTdds}
          showRules={showRules}
          story={story}
          tdds={tddDocs.map((t) => (
            <BackendTddPanel key={t.id} projectId={projectId} row={t} />
          ))}
          rulesPanel={
            <BackendRulesTable projectId={projectId} rows={ruleDocs} />
          }
        />
      </div>
    </div>
  );
}

// Fetch 1 TDD backend → map sang TddSchema → đưa vào TddPreviewPanel (chế độ parsed).
function BackendTddPanel({
  projectId,
  row,
}: {
  projectId: string;
  row: DocumentListRow;
}) {
  const { document, isLoading } = useDocument(row.id);
  if (isLoading || !document) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-4" />
      </div>
    );
  }
  return (
    <TddPreviewPanel
      id={row.docKey}
      parsed={adaptTdd(document)}
      href={`/projects/${projectId}/documents/${row.id}`}
    />
  );
}

// Fetch song song các Rule backend → map sang RuleSchema → đưa vào BusinessRulesTable.
function BackendRulesTable({
  projectId,
  rows,
}: {
  projectId: string;
  rows: DocumentListRow[];
}) {
  const results = useQueries({
    queries: rows.map((r) => ({
      queryKey: projectKeys.document(r.id),
      queryFn: () => documentService.get(r.id),
    })),
  });

  if (results.some((q) => q.isLoading)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-4" />
      </div>
    );
  }

  const rules: RuleRef[] = rows.map((r, i) => {
    const d = results[i].data;
    return d
      ? {
          id: r.docKey,
          parsed: adaptRule(d),
          href: `/projects/${projectId}/documents/${r.id}`,
        }
      : { id: r.docKey };
  });

  return <BusinessRulesTable rules={rules} />;
}
