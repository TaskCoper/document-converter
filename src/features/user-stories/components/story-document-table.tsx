import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type {
  StoryDocumentData,
  StoryDocumentOptions,
} from "../document-view-model";

const COLUMN_COUNT = 7;

type CellTone =
  | "default"
  | "title"
  | "metadata"
  | "separator"
  | "conditions"
  | "flow"
  | "acceptance"
  | "references"
  | "nonFunctional"
  | "outOfScope";

type TableCell = {
  content: ReactNode;
  colSpan?: number;
  rowSpan?: number;
  header?: boolean;
  scope?: "colgroup" | "row" | "rowgroup";
  tone?: CellTone;
  align?: "left" | "center";
};

const cellToneClass: Record<CellTone, string> = {
  default: "bg-background",
  title: "bg-muted/80 font-semibold",
  metadata: "bg-chart-3/15 font-semibold",
  separator: "h-2 bg-muted/70 p-0",
  conditions: "bg-chart-2/10 font-semibold",
  flow: "bg-chart-1/10 font-semibold",
  acceptance: "bg-chart-4/10 font-semibold",
  references: "bg-chart-5/10 font-semibold",
  nonFunctional: "bg-destructive/10 font-semibold",
  outOfScope: "bg-primary/10 font-semibold",
};

const sectionCell = (
  content: ReactNode,
  rowSpan: number,
  tone: CellTone,
): TableCell => ({
  content,
  rowSpan,
  header: true,
  scope: "rowgroup",
  tone,
  align: "center",
});

const labelCell = (
  content: ReactNode,
  colSpan = 2,
  rowSpan?: number,
): TableCell => ({
  content,
  colSpan,
  rowSpan,
  header: true,
  scope: "row",
});

const valueCell = (
  content: ReactNode,
  colSpan = 4,
  rowSpan?: number,
): TableCell => ({
  content,
  colSpan,
  rowSpan,
});

const centeredHeaderCell = (
  content: ReactNode,
  rowSpan?: number,
): TableCell => ({
  content,
  rowSpan,
  header: true,
  scope: "row",
  align: "center",
});

const separatorRow = (): TableCell[] => [
  {
    content: null,
    colSpan: COLUMN_COUNT,
    tone: "separator",
  },
];

function renderContent(content: ReactNode) {
  return content === "" || content === null || content === undefined ? (
    <span aria-hidden="true">&nbsp;</span>
  ) : (
    content
  );
}

export function StoryDocumentTable({
  data,
  linkHref,
  className,
}: {
  data: StoryDocumentData;
  linkHref?: StoryDocumentOptions["linkHref"];
  className?: string;
}) {
  const rows: TableCell[][] = [];
  const meta = data.metadata;
  const assignees = meta.assignee.length
    ? meta.assignee
    : [{ name: "", position: "FE" }];

  const metadataRowCount = 6 + assignees.length;
  rows.push([
    sectionCell("METADATA", metadataRowCount, "metadata"),
    labelCell("Story"),
    valueCell(meta.story),
  ]);
  rows.push([labelCell("Context"), valueCell(meta.context)]);
  rows.push([
    labelCell("Sprint"),
    valueCell(meta.sprint ? `S${meta.sprint}` : ""),
  ]);
  rows.push([labelCell("Priority"), valueCell(meta.priority)]);
  assignees.forEach((assignee, index) => {
    rows.push([
      ...(index === 0
        ? [labelCell("Assignee", 1, assignees.length)]
        : []),
      {
        content: assignee.position,
        header: true,
        scope: "row",
        align: "center",
      },
      valueCell(assignee.name),
    ]);
  });
  rows.push([labelCell("Creator"), valueCell(meta.creator)]);
  rows.push([labelCell("Status"), valueCell(meta.status)]);
  rows.push(separatorRow());

  const preconditions = data.conditions.preconditions.length
    ? data.conditions.preconditions
    : [""];
  const conditionsRowCount = preconditions.length + 1;
  preconditions.forEach((precondition, index) => {
    rows.push([
      ...(index === 0
        ? [
            sectionCell("CONDITIONS", conditionsRowCount, "conditions"),
            labelCell("Preconditions", 2, preconditions.length),
          ]
        : []),
      valueCell(precondition),
    ]);
  });
  rows.push([labelCell("Trigger"), valueCell(data.conditions.trigger)]);
  rows.push(separatorRow());

  const mainFlow = data.flow.mainFlow.length ? data.flow.mainFlow : [""];
  const alternativeFlow = data.flow.alternativeFlow.filter(
    (flow) => flow.steps.length > 0,
  );
  const exceptionFlow = data.flow.exceptionFlow.filter(
    (flow) => flow.steps.length > 0,
  );
  const alternativeRowCount = alternativeFlow.reduce(
    (count, flow) => count + flow.steps.length,
    0,
  );
  const exceptionRowCount = exceptionFlow.reduce(
    (count, flow) => count + flow.steps.length,
    0,
  );
  const flowRowCount =
    mainFlow.length + alternativeRowCount + exceptionRowCount;

  mainFlow.forEach((step, index) => {
    rows.push([
      ...(index === 0
        ? [
            sectionCell("FLOW", flowRowCount, "flow"),
            labelCell(
              data.flow.mainFlowTitle?.trim() || "Main Flow",
              2,
              mainFlow.length,
            ),
          ]
        : []),
      valueCell(step ? `${index + 1}. ${step}` : ""),
    ]);
  });

  let alternativeStepIndex = 0;
  alternativeFlow.forEach((flow) => {
    flow.steps.forEach((step, stepIndex) => {
      rows.push([
        ...(alternativeStepIndex === 0
          ? [labelCell("Alternative Flow", 1, alternativeRowCount)]
          : []),
        ...(stepIndex === 0
          ? [
              centeredHeaderCell(
                flow.code || flow.title || "",
                flow.steps.length,
              ),
            ]
          : []),
        valueCell(step),
      ]);
      alternativeStepIndex += 1;
    });
  });

  let exceptionStepIndex = 0;
  exceptionFlow.forEach((flow) => {
    flow.steps.forEach((step, stepIndex) => {
      rows.push([
        ...(exceptionStepIndex === 0
          ? [labelCell("Exception Flow", 1, exceptionRowCount)]
          : []),
        ...(stepIndex === 0
          ? [
              centeredHeaderCell(
                flow.code || flow.title || "",
                flow.steps.length,
              ),
            ]
          : []),
        valueCell(step),
      ]);
      exceptionStepIndex += 1;
    });
  });
  rows.push(separatorRow());

  const acceptanceGroups = data.acceptanceCriteria.filter(
    (group) => group.criterias.length > 0,
  );
  if (acceptanceGroups.length > 0) {
    const acceptanceRowCount = acceptanceGroups.reduce(
      (count, group) => count + group.criterias.length,
      0,
    );
    let acceptanceIndex = 0;
    acceptanceGroups.forEach((group) => {
      group.criterias.forEach((criteria, criteriaIndex) => {
        rows.push([
          ...(acceptanceIndex === 0
            ? [
                sectionCell(
                  "ACCEPTANCE CRITERIA",
                  acceptanceRowCount,
                  "acceptance",
                ),
              ]
            : []),
          ...(criteriaIndex === 0
            ? [
                centeredHeaderCell(
                  group.code || "AC",
                  group.criterias.length,
                ),
              ]
            : []),
          centeredHeaderCell(criteria.type),
          valueCell(criteria.step),
        ]);
        acceptanceIndex += 1;
      });
    });
    rows.push(separatorRow());
  }

  const referenceGroups = [
    { label: "TDDs", items: data.references.tdds },
    { label: "Rules", items: data.references.rules },
    { label: "Dependencies", items: data.references.dependencies },
  ].filter((group) => group.items.length > 0);
  const referenceRowCount = referenceGroups.reduce(
    (count, group) => count + group.items.length,
    0,
  );
  let referenceIndex = 0;
  referenceGroups.forEach((group) => {
    group.items.forEach((item, itemIndex) => {
      const href = linkHref ? linkHref(item) : `/view/${item.path}`;
      rows.push([
        ...(referenceIndex === 0
          ? [sectionCell("REFERENCES", referenceRowCount, "references")]
          : []),
        ...(itemIndex === 0
          ? [labelCell(group.label, 2, group.items.length)]
          : []),
        valueCell(
          href ? (
            <Link
              to={href}
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              {item.id}
            </Link>
          ) : (
            item.id
          ),
        ),
      ]);
      referenceIndex += 1;
    });
  });
  if (referenceRowCount > 0) rows.push(separatorRow());

  if (data.nonFunctional.length > 0) {
    data.nonFunctional.forEach((requirement, index) => {
      rows.push([
        ...(index === 0
          ? [
              sectionCell(
                "NON-FUNCTIONAL",
                data.nonFunctional.length,
                "nonFunctional",
              ),
            ]
          : []),
        valueCell(requirement, 6),
      ]);
    });
    rows.push(separatorRow());
  }

  if (data.outOfScope.length > 0) {
    data.outOfScope.forEach((item, index) => {
      rows.push([
        ...(index === 0
          ? [
              sectionCell(
                "OUT OF SCOPE",
                data.outOfScope.length,
                "outOfScope",
              ),
            ]
          : []),
        valueCell(item, 6),
      ]);
    });
  }

  return (
    <div
      className={cn(
        "h-full min-h-0 overflow-auto bg-background text-foreground",
        className,
      )}
    >
      <div className="min-w-[44rem] p-3">
        <table
          aria-label={`Nội dung User Story ${meta.id || ""}`.trim()}
          className="w-full table-fixed border-collapse text-xs leading-snug"
        >
          <caption className="border border-border/70 bg-muted/80 px-2 py-1.5 text-center text-xs font-semibold">
            Nội dung chi tiết của User Story {meta.id}
          </caption>
          <colgroup>
            {Array.from({ length: COLUMN_COUNT }, (_, index) => (
              <col key={index} />
            ))}
          </colgroup>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => {
                  const Component = cell.header ? "th" : "td";
                  return (
                    <Component
                      key={cellIndex}
                      colSpan={cell.colSpan}
                      rowSpan={cell.rowSpan}
                      scope={cell.header ? cell.scope : undefined}
                      className={cn(
                        "break-words border border-border/70 px-2 py-1.5 align-middle font-normal",
                        cell.align === "center" && "text-center",
                        cell.header && "font-medium",
                        cellToneClass[cell.tone ?? "default"],
                      )}
                    >
                      {renderContent(cell.content)}
                    </Component>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
