import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { MermaidDiagram } from "./tdd-preview-panel";
import { DocStatusLabel, type TddSchema } from "../validations";

type DiagramData = TddSchema["architecture"];

function Prose({ text }: { text?: string }) {
  if (!text?.trim()) return null;
  return (
    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-3">
      {text}
    </p>
  );
}

function BulletList({ items }: { items?: string[] }) {
  const filled = items?.filter((s) => s?.trim());
  if (!filled?.length) return null;
  return (
    <ul className="list-disc pl-5 text-sm text-gray-800 space-y-0.5 mb-3">
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
    <table className="border-collapse text-sm mb-4">
      <tbody>
        {filled.map(([k, v]) => (
          <tr key={k}>
            <td className="border border-gray-300 px-3 py-1.5 font-medium bg-gray-50 whitespace-nowrap w-40 align-top">
              {k}
            </td>
            <td className="border border-gray-300 px-3 py-1.5 align-top">
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
    <div className="overflow-x-auto mb-4">
      <table className="border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="border border-gray-300 px-3 py-1.5 bg-gray-50 font-semibold text-center whitespace-nowrap"
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
                <td key={j} className="border border-gray-300 px-3 py-1.5">
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

function H2({ num, title }: { num: number; title: string }) {
  return (
    <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3 pb-1 border-b border-gray-200">
      {num}. {title}
    </h2>
  );
}

function H3({ num, title }: { num: string; title: string }) {
  return (
    <h3 className="text-sm font-semibold text-gray-700 mt-4 mb-2">
      {num}. {title}
    </h3>
  );
}

function DiagramBlock({ data }: { data?: DiagramData }) {
  if (!data) return null;
  return (
    <>
      <Prose text={data.description} />
      {data.mermaid?.trim() && (
        <div className="my-4 border border-gray-200 rounded overflow-hidden bg-muted/30">
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
    !!(d?.description?.trim() || d?.mermaid?.trim() || any(d?.notes));

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
    internal: next(hasInternal),
    external: next(hasExternal),
    refs: next(hasRefs),
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
    <div className="font-sans text-gray-900 w-full pb-12">
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
              <BulletList items={ctx?.goals} />
            </>
          )}
          {any(ctx?.nonGoals) && (
            <>
              <H3 num={`${n.ctx}.3`} title="Ngoài phạm vi (Non-goals)" />
              <BulletList items={ctx?.nonGoals} />
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
      {hasInternal && (
        <>
          <H2 num={n.internal} title="API Contract (nội bộ)" />
          {internal?.endpoints?.some((e) => e.endpoint?.trim()) && (
            <>
              <H3 num={`${n.internal}.1`} title="Endpoints" />
              <DataTable
                headers={["Endpoint", "Method", "Mô tả"]}
                rows={(internal.endpoints ?? [])
                  .filter((e) => e.endpoint?.trim())
                  .map((e) => [e.endpoint, e.method, e.description])}
              />
            </>
          )}
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
                      <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs font-mono overflow-x-auto whitespace-pre">
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
              <DataTable
                headers={["Endpoint", "Mục đích", "Ghi chú"]}
                rows={(external.endpoints ?? [])
                  .filter((e) => e.endpoint?.trim())
                  .map((e) => [e.endpoint, e.purpose, e.note ?? ""])}
              />
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
          <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1 mb-4">
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
