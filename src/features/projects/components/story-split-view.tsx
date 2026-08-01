import {
  BusinessRulesTable,
  StoryPreviewLayout,
  TddPreviewPanel,
  type RuleRef,
} from "@/components/story-document-view";
import { Spinner } from "@/components/ui/spinner";
import { StoryDocumentTable } from "@/features/user-stories/components/story-document-table";
import type { StoryDocumentData } from "@/features/user-stories/document-view-model";
import { PROJECT_STALE, projectKeys } from "@/lib/query-keys";
import { useQueries } from "@tanstack/react-query";
import { Columns2, FlaskConical, MonitorCheck, Rows2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adaptRule, adaptTdd, storyLinkHref } from "../adapt-document";
import documentService from "../document-services";
import {
  ApprovalStateLabel,
  DocumentLinkType,
  DocumentType,
  type DocumentDetail,
  type IncomingLink,
  type ResolvedLink,
} from "../document-types";
import { useDocument } from "../hooks/use-document";
import { useIncomingLinks } from "../hooks/use-document-graph";

const REF = { UserStory: 1, Tdd: 2, BusinessRule: 3 };

const UNIT_TEST_TYPE_LABELS: Record<number, string> = {
  1: "Happy",
  2: "Branch",
  3: "Boundary",
  4: "Error",
  5: "Quirk",
  6: "Determinism",
};

const SYSTEM_TEST_TYPE_LABELS: Record<number, string> = {
  10: "Main",
  11: "ALT",
  12: "EXC",
  13: "NFR",
  20: "EXC / Integration boundary",
};

const TEST_SUITE_LABELS: Record<number, string> = {
  1: "SMOKE",
  2: "REGRESSION",
  3: "FULL",
};

// Liên kết đã nối được với tài liệu thật — chỉ những cái này mới mở/hiển thị nội dung được.
type LinkedDoc = { id: string; docKey: string };

const linkedOfKind = (links: ResolvedLink[], kind: number): LinkedDoc[] =>
  links
    .filter((l) => l.targetKind === kind && l.targetDocumentId)
    .map((l) => ({ id: l.targetDocumentId!, docKey: l.targetDocKey }));

const incomingTestsOfType = (
  links: IncomingLink[],
  type: DocumentType,
): LinkedDoc[] =>
  Array.from(
    new Map(
      links
        .filter(
          (link) =>
            link.linkType === DocumentLinkType.Verifies &&
            link.sourceDocType === type,
        )
        .map((link) => [
          link.sourceDocumentId,
          {
            id: link.sourceDocumentId,
            docKey: link.sourceDocKey,
          },
        ]),
    ).values(),
  );

// Trang chi tiết US backend tái dùng ĐÚNG bố cục + component của view.page (StoryPreviewLayout,
// TddPreviewPanel, BusinessRulesTable). Chỉ khác nguồn: TDD/Rule liên quan lấy thẳng từ
// doc.resolvedLinks (backend đã nối sẵn docKey→id) rồi fetch + map sang schema
// (adaptTdd/adaptRule) để đưa vào các component đó (chế độ `parsed`).
export function StorySplitView({
  projectId,
  doc,
  storyData,
}: {
  projectId: string;
  doc: DocumentDetail;
  storyData: StoryDocumentData;
}) {
  const tddDocs = linkedOfKind(doc.resolvedLinks, REF.Tdd);
  const ruleDocs = linkedOfKind(doc.resolvedLinks, REF.BusinessRule);
  const { links: incomingLinks, isLoading: testsLoading } = useIncomingLinks(
    doc.id,
  );
  const unitTestDocs = incomingTestsOfType(
    incomingLinks,
    DocumentType.UnitTest,
  );
  const systemTestDocs = incomingTestsOfType(
    incomingLinks,
    DocumentType.SystemTest,
  );

  const [tddsOpen, setTddsOpen] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(true);
  const [activeTestView, setActiveTestView] = useState<
    "unit" | "system" | null
  >(null);

  const canTdds = tddDocs.length > 0;
  const canRules = ruleDocs.length > 0;
  const showTdds = canTdds && tddsOpen;
  const showRules = canRules && rulesOpen;
  const showUnitTests = activeTestView === "unit";
  const showSystemTests = activeTestView === "system";

  const linkHref = useMemo(() => storyLinkHref(doc), [doc]);
  const story = (
    <StoryDocumentTable data={storyData} linkHref={linkHref} />
  );

  return (
    <div className="flex h-full flex-col gap-2">
      <div
        role="group"
        aria-label="Tài liệu liên quan"
        className="flex shrink-0 flex-wrap items-center gap-1 border-b border-border"
      >
        {canTdds && (
          <button
            type="button"
            aria-pressed={activeTestView === null && tddsOpen}
            onClick={() => {
              if (activeTestView !== null) {
                setActiveTestView(null);
                setTddsOpen(true);
                return;
              }
              setTddsOpen((value) => !value);
            }}
            className={viewTabClass(activeTestView === null && tddsOpen)}
          >
            <Columns2 className="size-3.5" />
            TDDs
            <TabCount>{tddDocs.length}</TabCount>
          </button>
        )}
        {canRules && (
          <button
            type="button"
            aria-pressed={activeTestView === null && rulesOpen}
            onClick={() => {
              if (activeTestView !== null) {
                setActiveTestView(null);
                setRulesOpen(true);
                return;
              }
              setRulesOpen((value) => !value);
            }}
            className={viewTabClass(activeTestView === null && rulesOpen)}
          >
            <Rows2 className="size-3.5" />
            Rules
            <TabCount>{ruleDocs.length}</TabCount>
          </button>
        )}
        {testsLoading ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Đang tải tests...
          </span>
        ) : (
          <>
            <button
              type="button"
              disabled={unitTestDocs.length === 0}
              aria-pressed={showUnitTests}
              onClick={() =>
                setActiveTestView(showUnitTests ? null : "unit")
              }
              className={viewTabClass(showUnitTests)}
            >
              <FlaskConical className="size-3.5" />
              Unit Tests
              <TabCount>{unitTestDocs.length}</TabCount>
            </button>
            <button
              type="button"
              disabled={systemTestDocs.length === 0}
              aria-pressed={showSystemTests}
              onClick={() =>
                setActiveTestView(showSystemTests ? null : "system")
              }
              className={viewTabClass(showSystemTests)}
            >
              <MonitorCheck className="size-3.5" />
              System Tests
              <TabCount>{systemTestDocs.length}</TabCount>
            </button>
          </>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden border border-border/40">
        {showUnitTests ? (
          <div className="h-full overflow-auto bg-background">
            <TestDocumentsPanel
              projectId={projectId}
              title="Unit Tests"
              docs={unitTestDocs}
              type="unit"
            />
          </div>
        ) : showSystemTests ? (
          <div className="h-full overflow-auto bg-background">
            <TestDocumentsPanel
              projectId={projectId}
              title="System Tests"
              docs={systemTestDocs}
              type="system"
            />
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

function viewTabClass(active: boolean) {
  return [
    "inline-flex h-9 items-center gap-2 border-b-2 px-3 text-xs font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-40",
    active
      ? "border-primary bg-primary/10 text-primary"
      : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  ].join(" ");
}

function TabCount({ children }: { children: number }) {
  return (
    <span className="rounded-full bg-foreground/5 px-1.5 py-0.5 font-mono text-[9px]">
      {children}
    </span>
  );
}

function TestDocumentsPanel({
  projectId,
  title,
  docs,
  type,
}: {
  projectId: string;
  title: string;
  docs: LinkedDoc[];
  type: "unit" | "system";
}) {
  const results = useQueries({
    queries: docs.map((testDoc) => ({
      queryKey: projectKeys.document(testDoc.id),
      queryFn: () => documentService.get(testDoc.id),
      staleTime: PROJECT_STALE,
    })),
  });

  return (
    <section aria-label={title}>
      {results.some((result) => result.isLoading) ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner className="size-4" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          {type === "unit" ? (
            <UnitTestsTable
              projectId={projectId}
              documents={results.flatMap((result) =>
                result.data ? [result.data] : [],
              )}
            />
          ) : (
            <SystemTestsTable
              projectId={projectId}
              documents={results.flatMap((result) =>
                result.data ? [result.data] : [],
              )}
            />
          )}
        </div>
      )}
    </section>
  );
}

function UnitTestsTable({
  projectId,
  documents,
}: {
  projectId: string;
  documents: DocumentDetail[];
}) {
  return (
    <TestTable>
      <thead>
        <tr>
          {[
            "Test ID",
            "Module",
            "Unit under test",
            "Loại",
            "Suite",
            "Priority",
            "Precondition / Mock setup",
            "Input",
            "Expected output",
            "Trace to",
            "Rationale",
            "Owner",
            "Trạng thái",
          ].map((heading) => (
            <TestTableHeading key={heading}>{heading}</TestTableHeading>
          ))}
        </tr>
      </thead>
      <tbody>
        {documents.map((document) => (
          <tr
            key={document.id}
            className="align-top"
          >
            <TestIdCell projectId={projectId} document={document} />
            <TestTableCell>{document.content.module}</TestTableCell>
            <TestTableCell>{document.content.unitUnderTest}</TestTableCell>
            <TestTableCell>
              {labelOf(
                UNIT_TEST_TYPE_LABELS,
                document.content.unitTestType,
              )}
            </TestTableCell>
            <TestTableCell>
              {labelOf(TEST_SUITE_LABELS, document.content.testSuite)}
            </TestTableCell>
            <TestTableCell>
              {priorityLabel(document.content.testPriority)}
            </TestTableCell>
            <TestTableCell className="min-w-64">
              {document.content.mockSetup}
            </TestTableCell>
            <TestTableCell className="min-w-56">
              {document.content.input}
            </TestTableCell>
            <TestTableCell className="min-w-72">
              {document.content.expectedOutput}
            </TestTableCell>
            <TestTableCell className="min-w-52">
              <TestLinks projectId={projectId} document={document} />
            </TestTableCell>
            <TestTableCell className="min-w-64">
              {document.content.rationale}
            </TestTableCell>
            <TestTableCell>{document.content.testOwnerName}</TestTableCell>
            <TestTableCell>
              {document.isArchived
                ? "Lưu trữ"
                : ApprovalStateLabel[document.approvalState]}
            </TestTableCell>
          </tr>
        ))}
      </tbody>
    </TestTable>
  );
}

function SystemTestsTable({
  projectId,
  documents,
}: {
  projectId: string;
  documents: DocumentDetail[];
}) {
  return (
    <TestTable>
      <thead>
        <tr>
          {[
            "Test ID",
            "Story",
            "Loại",
            "Suite",
            "Priority",
            "Precondition",
            "Steps",
            "Test data",
            "Expected result",
            "Trace to",
            "Rationale",
            "Owner",
            "Trạng thái",
          ].map((heading) => (
            <TestTableHeading key={heading}>{heading}</TestTableHeading>
          ))}
        </tr>
      </thead>
      <tbody>
        {documents.map((document) => (
          <tr
            key={document.id}
            className="align-top"
          >
            <TestIdCell projectId={projectId} document={document} />
            <TestTableCell>{document.content.storyKey}</TestTableCell>
            <TestTableCell>
              {labelOf(
                SYSTEM_TEST_TYPE_LABELS,
                document.content.systemTestType,
              )}
            </TestTableCell>
            <TestTableCell>
              {labelOf(TEST_SUITE_LABELS, document.content.testSuite)}
            </TestTableCell>
            <TestTableCell>
              {priorityLabel(document.content.testPriority)}
            </TestTableCell>
            <TestTableCell className="min-w-64">
              {document.content.testPrecondition}
            </TestTableCell>
            <TestTableCell className="min-w-56">
              <ol className="list-decimal space-y-1 pl-4">
                {document.content.listItems.map((step) => (
                  <li key={`${step.itemType}-${step.content}`}>
                    {step.content}
                  </li>
                ))}
              </ol>
            </TestTableCell>
            <TestTableCell className="min-w-52">
              {document.content.testData}
            </TestTableCell>
            <TestTableCell className="min-w-72">
              {document.content.expectedResult}
            </TestTableCell>
            <TestTableCell className="min-w-52">
              <TestLinks projectId={projectId} document={document} />
            </TestTableCell>
            <TestTableCell className="min-w-64">
              {document.content.rationale}
            </TestTableCell>
            <TestTableCell>{document.content.testOwnerName}</TestTableCell>
            <TestTableCell>
              {document.isArchived
                ? "Lưu trữ"
                : ApprovalStateLabel[document.approvalState]}
            </TestTableCell>
          </tr>
        ))}
      </tbody>
    </TestTable>
  );
}

function TestTable({ children }: { children: React.ReactNode }) {
  return (
    <table className="w-max min-w-full border-separate border-spacing-0 text-left text-[10px]">
      {children}
    </table>
  );
}

function TestTableHeading({ children }: { children: React.ReactNode }) {
  return (
    <th className="sticky top-0 z-10 min-w-32 whitespace-nowrap border-b border-r border-border bg-primary px-2 py-1.5 text-center text-xs font-bold text-primary-foreground last:border-r-0">
      {children}
    </th>
  );
}

function TestTableCell({
  children,
  className = "",
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "id";
}) {
  return (
    <td
      className={`max-w-80 whitespace-normal break-words border-b border-r border-border px-2 py-1.5 align-top text-xs last:border-r-0 ${
        tone === "id"
          ? "bg-primary/10 font-mono text-[10px] font-semibold text-primary"
          : "bg-background text-foreground"
      } ${className}`}
    >
      {children || "—"}
    </td>
  );
}

function TestIdCell({
  projectId,
  document,
}: {
  projectId: string;
  document: DocumentDetail;
}) {
  return (
    <TestTableCell tone="id" className="whitespace-nowrap">
      <Link
        to={`/projects/${projectId}/documents/${document.id}`}
        className="text-xs text-primary hover:underline"
      >
        {document.docKey}
      </Link>
    </TestTableCell>
  );
}

function TestLinks({
  projectId,
  document,
}: {
  projectId: string;
  document: DocumentDetail;
}) {
  return (
    <div className="space-y-1.5">
      {document.resolvedLinks.map((link, index) => {
        const label = `${link.targetDocKey}${
          link.targetSection ? `/${link.targetSection}` : ""
        }`;

        return link.targetDocumentId ? (
          <Link
            key={`${label}-${index}`}
            to={`/projects/${projectId}/documents/${link.targetDocumentId}`}
            className="block font-medium text-primary hover:underline"
          >
            {label}
          </Link>
        ) : (
          <span key={`${label}-${index}`} className="block">
            {label}
          </span>
        );
      })}
    </div>
  );
}

function labelOf(
  labels: Record<number, string>,
  value: number | null,
): string {
  return value === null ? "—" : (labels[value] ?? String(value));
}

function priorityLabel(priority: number | null): string {
  return priority === null ? "—" : `P${priority}`;
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
