import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { DocStatusLabel, type TddSchema } from "../validations";
import { MermaidDiagram } from "./tdd-preview-panel";

type DiagramData = TddSchema["architecture"];

function Prose({ text }: { text?: string }) {
  if (!text?.trim()) return null;
  return (
    <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
      {text}
    </p>
  );
}

function BulletList({ items }: { items?: string[] }) {
  const filled = items?.filter((s) => s?.trim());
  if (!filled?.length) return null;
  return (
    <ul className="mb-3 list-disc space-y-0.5 pl-5 text-sm text-foreground">
      {filled.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function KvTable({ rows }: { rows: [string, string | null | undefined][] }) {
  const filled = rows.filter(([, v]) => v?.trim());
  if (!filled.length) return null;
  return (
    <table className="mb-4 border-collapse text-sm">
      <tbody>
        {filled.map(([k, v]) => (
          <tr key={k}>
            <td className="w-40 whitespace-nowrap border border-border bg-muted/60 px-3 py-1.5 align-top font-medium">
              {k}
            </td>
            <td className="border border-border bg-background px-3 py-1.5 align-top">
              {v}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const filled = rows.filter((r) => r.some((c) => c?.trim()));
  if (!filled.length) return null;
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap border border-border bg-muted/60 px-3 py-1.5 text-center font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filled.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border border-border bg-background px-3 py-1.5">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── API: một thẻ cho MỖI endpoint, ví dụ nằm bên trong endpoint của nó ────────────────
//
// Bố cục cũ là bảng phẳng + một danh sách ví dụ rời phía dưới, nên không đọc được ví dụ nào
// thuộc endpoint nào; mỗi ví dụ lại chỉ hiện được một trong ba mẫu (request/response/error).
// Bản Markdown do backend sinh ra vốn đã in đủ cả ba — chính màn hình này mới là chỗ thiếu.

const METHOD_COLOR: Record<string, string> = {
  GET: "border-chart-3/50 bg-chart-3/15 text-foreground",
  POST: "border-chart-2/50 bg-chart-2/15 text-foreground",
  PUT: "border-chart-4/50 bg-chart-4/15 text-foreground",
  PATCH: "border-chart-5/50 bg-chart-5/15 text-foreground",
  DELETE: "border-destructive/50 bg-destructive/15 text-foreground",
  HEAD: "border-border bg-muted text-muted-foreground",
  OPTIONS: "border-border bg-muted text-muted-foreground",
};

function MethodBadge({ method }: { method?: string }) {
  if (!method) return null;
  return (
    <span
      className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
        METHOD_COLOR[method] ??
        "border-border bg-muted text-muted-foreground"
      }`}
    >
      {method}
    </span>
  );
}

function SamplePane({
  label,
  status,
  body,
  tone,
}: {
  label: string;
  status?: number | null;
  body?: string;
  tone?: "error";
}) {
  if (!body?.trim()) return null;
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center gap-2">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wide ${
            tone === "error" ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
        {status != null && (
          <span className="rounded border border-border bg-muted px-1 font-mono text-[11px] text-muted-foreground">
            {status}
          </span>
        )}
      </div>
      <pre className="overflow-x-auto whitespace-pre rounded border border-border bg-muted/60 p-2 font-mono text-xs text-foreground">
        {body.trim()}
      </pre>
    </div>
  );
}

type ApiExample = NonNullable<
  TddSchema["internalApi"]["endpoints"][number]["examples"]
>[number];

function ExampleBlock({ ex }: { ex: ApiExample }) {
  const hasAny =
    ex.requestSample?.trim() ||
    ex.responseSample?.trim() ||
    ex.errorSample?.trim();
  if (!hasAny && !ex.title?.trim()) return null;
  return (
    <div className="border-t border-border px-3 py-2.5">
      {ex.title?.trim() && (
        <p className="mb-2 text-sm font-medium text-foreground">{ex.title}</p>
      )}
      {/* Ba mẫu đặt cạnh nhau — trước đây chỉ một trong ba sống sót. */}
      <div className="flex flex-col gap-3 md:flex-row">
        <SamplePane label="Request" body={ex.requestSample} />
        <SamplePane
          label="Response"
          status={ex.responseStatus}
          body={ex.responseSample}
        />
        <SamplePane label="Error" body={ex.errorSample} tone="error" />
      </div>
    </div>
  );
}

function EndpointCard({
  method,
  path,
  name,
  description,
  examples,
}: {
  method?: string;
  path: string;
  name?: string;
  description?: string;
  examples?: ApiExample[];
}) {
  return (
    <div className="mb-3 overflow-hidden rounded border border-border">
      <div className="flex flex-wrap items-center gap-2 bg-muted/60 px-3 py-2">
        <MethodBadge method={method} />
        <code className="min-w-0 break-all font-mono text-sm text-foreground">
          {path}
        </code>
        {name?.trim() && (
          <span className="text-xs text-muted-foreground">— {name}</span>
        )}
      </div>
      {description?.trim() && (
        <p className="px-3 py-2 text-sm leading-relaxed text-foreground">
          {description}
        </p>
      )}
      {(examples ?? []).map((ex, i) => (
        <ExampleBlock key={i} ex={ex} />
      ))}
    </div>
  );
}

// Nhãn G1/NG2 chỉ có trong DB (Markdown của TDD không chứa chúng). Tra theo NỘI DUNG chứ
// không theo vị trí — giống hệt cách saveTdd giữ nhãn lúc lưu, nên hai chiều không lệch nhau.
function withLabels(
  items?: string[],
  labelled?: { label?: string | null; content: string }[],
): string[] {
  if (!items) return [];
  if (!labelled?.length) return items;
  const byContent = new Map(
    labelled.filter((l) => l.label).map((l) => [l.content.trim(), l.label]),
  );
  return items.map((s) => {
    const label = byContent.get(s.trim());
    return label ? `${label}. ${s}` : s;
  });
}

function H2({ num, title }: { num: number; title: string }) {
  return (
    <h2 className="mt-8 mb-3 border-b border-border pb-1 text-lg font-bold text-foreground">
      {num}. {title}
    </h2>
  );
}

function H3({ num, title }: { num: string; title: string }) {
  return (
    <h3 className="mt-4 mb-2 text-sm font-semibold text-muted-foreground">
      {num}. {title}
    </h3>
  );
}

function DiagramBlock({ data }: { data?: DiagramData }) {
  if (!data) return null;
  return (
    <>
      {data.title?.trim() && (
        <p className="mb-1 text-sm font-semibold text-foreground">{data.title}</p>
      )}
      <Prose text={data.description} />
      {data.mermaid?.trim() && (
        <div className="my-4 overflow-hidden rounded border border-border bg-muted/30">
          <TransformWrapper
            minScale={0.3}
            maxScale={4}
            doubleClick={{ disabled: false }}
            wheel={{ step: 0.1 }}
          >
            {({ resetTransform }) => (
              <>
                <div className="flex justify-end px-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => resetTransform()}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Reset
                  </button>
                </div>
                <TransformComponent
                  wrapperStyle={{ width: "100%", cursor: "grab" }}
                  contentStyle={{ width: "100%", padding: "8px" }}
                >
                  <div className="w-full [&_svg]:!w-full [&_svg]:!h-auto [&_svg]:!max-w-none">
                    <MermaidDiagram code={data.mermaid} />
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      )}
      {data.notes?.some((n) => n?.trim()) && (
        <>
          <p className="text-sm font-semibold mb-1">Ghi chú:</p>
          <BulletList items={data.notes} />
        </>
      )}
    </>
  );
}

export function TddDocumentView({ data }: { data: Partial<TddSchema> }) {
  const info = data.documentInfo;
  const ctx = data.contextGoals;
  const internal = data.internalApi;
  const external = data.externalApi;
  const refs = data.references;

  const any = (items?: string[]) => items?.some((s) => s?.trim()) ?? false;
  const hasDiagram = (d?: DiagramData) =>
    !!(
      d?.description?.trim() ||
      d?.mermaid?.trim() ||
      d?.title?.trim() ||
      any(d?.notes)
    );

  const hasInfo = !!(
    info?.docId ||
    info?.feature ||
    info?.author ||
    info?.reviewer ||
    info?.version ||
    info?.updatedAt ||
    any(info?.relatedStories) ||
    any(info?.businessRules)
  );
  const hasCtx = !!(
    ctx?.problem?.trim() ||
    any(ctx?.goals) ||
    any(ctx?.nonGoals)
  );
  const hasArch = hasDiagram(data.architecture as DiagramData);
  const hasSeq = hasDiagram(data.sequenceDiagram as DiagramData);
  const hasActivity = hasDiagram(data.activityDiagram as DiagramData);
  const hasState = hasDiagram(data.stateDiagram as DiagramData);
  const hasDataModel = hasDiagram(data.dataModel as DiagramData);
  const hasInternal = !!(
    internal?.endpoints?.some((e) => e.endpoint?.trim()) ||
    internal?.examples?.some((e) => e.title?.trim() || e.content?.trim()) ||
    internal?.errorCodes?.some((e) => e.code?.trim())
  );
  const hasExternal = !!(
    external?.endpoints?.some((e) => e.endpoint?.trim()) ||
    external?.fields?.some((f) => f.field?.trim()) ||
    external?.errorHandling?.trim() ||
    any(external?.quirks)
  );
  const hasRefs = !!(
    any(refs?.userStories) ||
    any(refs?.businessRules) ||
    any(refs?.useCases) ||
    any(refs?.others)
  );
  const hasChangeLog = !!data.changeLog?.some(
    (c) => c.version?.trim() || c.date?.trim() || c.change?.trim(),
  );
  // Ba mục dưới chỉ có ở nhánh backend — Markdown của TDD không có chỗ chứa chúng.
  const extraDiagrams = (data.extraDiagrams ?? []).filter(
    (d) => d.sourceCode?.trim() || d.externalUrl?.trim() || d.title?.trim(),
  );
  const hasExtraDiagrams = extraDiagrams.length > 0;
  const hasAssumptions = any(data.assumptions);
  const hasOpenQuestions = any(data.openQuestions);

  // Pre-compute sequential section numbers (only for visible sections)
  let counter = 0;
  const next = (show: boolean) => (show ? ++counter : 0);
  const n = {
    info: next(hasInfo),
    ctx: next(hasCtx),
    arch: next(hasArch),
    seq: next(hasSeq),
    activity: next(hasActivity),
    state: next(hasState),
    datamodel: next(hasDataModel),
    extra: next(hasExtraDiagrams),
    internal: next(hasInternal),
    external: next(hasExternal),
    refs: next(hasRefs),
    assumptions: next(hasAssumptions),
    openQuestions: next(hasOpenQuestions),
    changelog: next(hasChangeLog),
  };

  if (!counter) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Chưa có dữ liệu để xem trước.
      </p>
    );
  }

  const title = info?.feature
    ? `Technical Design Document — ${info.feature}`
    : info?.docId || "Technical Design Document";

  return (
    <div className="w-full pb-12 font-sans text-foreground">
      <h1 className="text-2xl font-normal mb-8">{title}</h1>

      {/* 1. Thông tin tài liệu */}
      {hasInfo && (
        <>
          <H2 num={n.info} title="Thông tin tài liệu" />
          <KvTable
            rows={[
              ["Doc ID", info?.docId],
              ["Tính năng", info?.feature],
              ["Tác giả", info?.author],
              ["Reviewer", info?.reviewer],
              [
                "Trạng thái",
                info?.status ? DocStatusLabel[info.status] : undefined,
              ],
              ["Phiên bản", info?.version],
              ["Cập nhật", info?.updatedAt],
              [
                "Story liên quan",
                any(info?.relatedStories)
                  ? info?.relatedStories?.filter((s) => s?.trim()).join(", ")
                  : undefined,
              ],
              [
                "Business Rules",
                any(info?.businessRules)
                  ? info?.businessRules?.filter((s) => s?.trim()).join(", ")
                  : undefined,
              ],
            ]}
          />
        </>
      )}

      {/* 2. Bối cảnh & Mục tiêu */}
      {hasCtx && (
        <>
          <H2 num={n.ctx} title="Bối cảnh & Mục tiêu" />
          {ctx?.problem?.trim() && (
            <>
              <H3 num={`${n.ctx}.1`} title="Vấn đề" />
              <Prose text={ctx.problem} />
            </>
          )}
          {any(ctx?.goals) && (
            <>
              <H3 num={`${n.ctx}.2`} title="Mục tiêu (Goals)" />
              <BulletList items={withLabels(ctx?.goals, data.goalLabels)} />
            </>
          )}
          {any(ctx?.nonGoals) && (
            <>
              <H3 num={`${n.ctx}.3`} title="Ngoài phạm vi (Non-goals)" />
              <BulletList
                items={withLabels(ctx?.nonGoals, data.nonGoalLabels)}
              />
            </>
          )}
        </>
      )}

      {/* Architecture */}
      {hasArch && (
        <>
          <H2 num={n.arch} title="Kiến trúc tổng quan (Architecture)" />
          <DiagramBlock data={data.architecture as DiagramData} />
        </>
      )}

      {/* Sequence Diagram */}
      {hasSeq && (
        <>
          <H2 num={n.seq} title="Sequence Diagram (luồng tương tác)" />
          <DiagramBlock data={data.sequenceDiagram as DiagramData} />
        </>
      )}

      {/* Activity Diagram */}
      {hasActivity && (
        <>
          <H2 num={n.activity} title="Activity Diagram (logic xử lý)" />
          <DiagramBlock data={data.activityDiagram as DiagramData} />
        </>
      )}

      {/* State Diagram */}
      {hasState && (
        <>
          <H2 num={n.state} title="State Diagram (vòng đời trạng thái)" />
          <DiagramBlock data={data.stateDiagram as DiagramData} />
        </>
      )}

      {/* Data Model */}
      {hasDataModel && (
        <>
          <H2 num={n.datamodel} title="Mô hình dữ liệu (Data Model / ERD)" />
          <DiagramBlock data={data.dataModel as DiagramData} />
        </>
      )}

      {/* Internal API */}
      {/* Sơ đồ ngoài 5 loại cố định (Flowchart, Other…) — trước đây không hiện ở đâu cả. */}
      {hasExtraDiagrams && (
        <>
          <H2 num={n.extra} title="Sơ đồ khác" />
          {extraDiagrams.map((d, i) => (
            <div key={i} className="mb-4">
              {d.title?.trim() && (
                <p className="mb-1 text-sm font-semibold text-foreground">
                  {d.title}
                </p>
              )}
              <Prose text={d.description} />
              {d.externalUrl?.trim() ? (
                <a
                  href={d.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-primary underline"
                >
                  {d.externalUrl}
                </a>
              ) : (
                d.sourceCode?.trim() && (
                  <pre className="overflow-x-auto whitespace-pre rounded border border-border bg-muted/60 p-3 font-mono text-xs text-foreground">
                    {d.sourceCode}
                  </pre>
                )
              )}
            </div>
          ))}
        </>
      )}

      {hasInternal && (
        <>
          <H2 num={n.internal} title="API Contract (nội bộ)" />
          {internal?.endpoints?.some((e) => e.endpoint?.trim()) && (
            <>
              <H3 num={`${n.internal}.1`} title="Endpoints" />
              {(internal.endpoints ?? [])
                .filter((e) => e.endpoint?.trim())
                .map((e, i) => (
                  <EndpointCard
                    key={i}
                    method={e.method}
                    path={e.endpoint}
                    name={e.name}
                    description={e.description}
                    examples={e.examples}
                  />
                ))}
            </>
          )}
          {/* Danh sách ví dụ rời chỉ còn ở nhánh GitHub: Markdown không gắn ví dụ với
              endpoint nên không có cách nào xếp chúng vào thẻ tương ứng. */}
          {internal?.examples?.some(
            (e) => e.title?.trim() || e.content?.trim(),
          ) && (
            <>
              <H3
                num={`${n.internal}.2`}
                title="Ví dụ request/response (kèm comment field)"
              />
              <div className="space-y-3 mb-4">
                {(internal.examples ?? [])
                  .filter((e) => e.title?.trim() || e.content?.trim())
                  .map((ex, i) => (
                    <div key={i}>
                      {ex.title && (
                        <p className="text-sm font-medium mb-1">{ex.title}</p>
                      )}
                      <pre className="overflow-x-auto whitespace-pre rounded border border-border bg-muted/60 p-3 font-mono text-xs text-foreground">
                        {ex.content}
                      </pre>
                    </div>
                  ))}
              </div>
            </>
          )}
          {internal?.errorCodes?.some((e) => e.code?.trim()) && (
            <>
              <H3 num={`${n.internal}.3`} title="Error code — quy ước" />
              <DataTable
                headers={["Code", "HTTP", "Khi nào xảy ra"]}
                rows={(internal.errorCodes ?? [])
                  .filter((e) => e.code?.trim())
                  .map((e) => [e.code, e.http, e.when])}
              />
            </>
          )}
        </>
      )}

      {/* External API */}
      {hasExternal && (
        <>
          <H2 num={n.external} title="API Contract — bên thứ ba (External)" />
          {external?.endpoints?.some((e) => e.endpoint?.trim()) && (
            <>
              <H3 num={`${n.external}.1`} title="Endpoint sử dụng" />
              {(external.endpoints ?? [])
                .filter((e) => e.endpoint?.trim())
                .map((e, i) => (
                  <EndpointCard
                    key={i}
                    method={e.method}
                    path={e.endpoint}
                    name={e.name}
                    description={[e.purpose, e.note].filter(Boolean).join(" · ")}
                    examples={e.examples}
                  />
                ))}
            </>
          )}
          {external?.fields?.some((f) => f.field?.trim()) && (
            <>
              <H3 num={`${n.external}.2`} title="Field quan trọng" />
              <DataTable
                headers={["Field", "Ý nghĩa", "Lưu ý"]}
                rows={(external.fields ?? [])
                  .filter((f) => f.field?.trim())
                  .map((f) => [f.field, f.meaning, f.note ?? ""])}
              />
            </>
          )}
          {external?.errorHandling?.trim() && (
            <>
              <H3 num={`${n.external}.3`} title="Error/response phía đối tác" />
              <Prose text={external.errorHandling} />
            </>
          )}
          {any(external?.quirks) && (
            <>
              <H3
                num={`${n.external}.4`}
                title="Quirk / cạm bẫy đã phát hiện"
              />
              <BulletList
                items={(external?.quirks ?? []).filter((q) => q?.trim())}
              />
            </>
          )}
        </>
      )}

      {/* References */}
      {hasRefs && (
        <>
          <H2 num={n.refs} title="Tham chiếu" />
          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-foreground">
            {any(refs?.userStories) && (
              <li>
                <strong>User Stories:</strong>{" "}
                {refs?.userStories?.filter((s) => s?.trim()).join(", ")}
              </li>
            )}
            {any(refs?.businessRules) && (
              <li>
                <strong>Business Rules:</strong>{" "}
                {refs?.businessRules?.filter((s) => s?.trim()).join(", ")}
              </li>
            )}
            {any(refs?.useCases) && (
              <li>
                <strong>Use Cases:</strong>{" "}
                {refs?.useCases?.filter((s) => s?.trim()).join(", ")}
              </li>
            )}
            {refs?.others
              ?.filter((s) => s?.trim())
              .map((o, i) => (
                <li key={i}>{o}</li>
              ))}
          </ul>
        </>
      )}

      {hasAssumptions && (
        <>
          <H2 num={n.assumptions} title="Giả định" />
          <BulletList items={data.assumptions} />
        </>
      )}

      {hasOpenQuestions && (
        <>
          <H2 num={n.openQuestions} title="Câu hỏi mở" />
          <BulletList items={data.openQuestions} />
        </>
      )}

      {/* Change Log */}
      {hasChangeLog && (
        <>
          <H2 num={n.changelog} title="Lịch sử thay đổi" />
          <DataTable
            headers={["Ngày", "Phiên bản", "Thay đổi", "Người"]}
            rows={(data.changeLog ?? [])
              .filter(
                (c) => c.version?.trim() || c.date?.trim() || c.change?.trim(),
              )
              .map((c) => [c.date, c.version, c.change, c.author])}
          />
        </>
      )}
    </div>
  );
}
