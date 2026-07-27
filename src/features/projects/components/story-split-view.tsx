import {
  BusinessRulesTable,
  StoryHtmlFrame,
  StoryPreviewLayout,
  TddPreviewPanel,
  type RuleRef,
} from "@/components/story-document-view";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PROJECT_STALE, projectKeys } from "@/lib/query-keys";
import { useQueries } from "@tanstack/react-query";
import { Columns2, Rows2 } from "lucide-react";
import { useState } from "react";
import { adaptRule, adaptTdd } from "../adapt-document";
import documentService from "../document-services";
import type { DocumentDetail, ResolvedLink } from "../document-types";
import { useDocument } from "../hooks/use-document";

const REF = { UserStory: 1, Tdd: 2, BusinessRule: 3 };

// Liên kết đã nối được với tài liệu thật — chỉ những cái này mới mở/hiển thị nội dung được.
type LinkedDoc = { id: string; docKey: string };

const linkedOfKind = (links: ResolvedLink[], kind: number): LinkedDoc[] =>
  links
    .filter((l) => l.targetKind === kind && l.targetDocumentId)
    .map((l) => ({ id: l.targetDocumentId!, docKey: l.targetDocKey }));

// Trang chi tiết US backend tái dùng ĐÚNG bố cục + component của view.page (StoryPreviewLayout,
// TddPreviewPanel, BusinessRulesTable). Chỉ khác nguồn: TDD/Rule liên quan lấy thẳng từ
// doc.resolvedLinks (backend đã nối sẵn docKey→id) rồi fetch + map sang schema
// (adaptTdd/adaptRule) để đưa vào các component đó (chế độ `parsed`).
export function StorySplitView({
  projectId,
  doc,
  storyHtml,
}: {
  projectId: string;
  doc: DocumentDetail;
  storyHtml: string;
}) {
  const tddDocs = linkedOfKind(doc.resolvedLinks, REF.Tdd);
  const ruleDocs = linkedOfKind(doc.resolvedLinks, REF.BusinessRule);

  const [tddsOpen, setTddsOpen] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(true);

  const canTdds = tddDocs.length > 0;
  const canRules = ruleDocs.length > 0;
  const showTdds = canTdds && tddsOpen;
  const showRules = canRules && rulesOpen;

  const story = <StoryHtmlFrame html={storyHtml} />;

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
            <BackendTddPanel key={t.id} projectId={projectId} doc={t} />
          ))}
          rulesPanel={
            <BackendRulesTable projectId={projectId} docs={ruleDocs} />
          }
        />
      </div>
    </div>
  );
}

// Fetch 1 TDD backend → map sang TddSchema → đưa vào TddPreviewPanel (chế độ parsed).
function BackendTddPanel({
  projectId,
  doc,
}: {
  projectId: string;
  doc: LinkedDoc;
}) {
  const { document } = useDocument(doc.id);
  if (!document) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-4" />
      </div>
    );
  }
  return (
    <TddPreviewPanel
      id={doc.docKey}
      parsed={adaptTdd(document)}
      href={`/projects/${projectId}/documents/${doc.id}`}
    />
  );
}

// Fetch song song các Rule backend → map sang RuleSchema → đưa vào BusinessRulesTable.
function BackendRulesTable({
  projectId,
  docs,
}: {
  projectId: string;
  docs: LinkedDoc[];
}) {
  const results = useQueries({
    queries: docs.map((d) => ({
      queryKey: projectKeys.document(d.id),
      queryFn: () => documentService.get(d.id),
      staleTime: PROJECT_STALE,
    })),
  });

  if (results.some((q) => q.isLoading)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-4" />
      </div>
    );
  }

  const rules: RuleRef[] = docs.map((d, i) => {
    const detail = results[i].data;
    return detail
      ? {
          id: d.docKey,
          parsed: adaptRule(detail),
          href: `/projects/${projectId}/documents/${d.id}`,
        }
      : { id: d.docKey };
  });

  return <BusinessRulesTable rules={rules} />;
}
