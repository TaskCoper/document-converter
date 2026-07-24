import { RuleStatusLabel, type RuleSchema } from "../validations";

function Prose({ text }: { text?: string }) {
  if (!text?.trim()) return null;
  return (
    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-3">
      {text}
    </p>
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

// Cùng ngôn ngữ trình bày với TddDocumentView (KvTable/Prose/H2 đánh số, ẩn mục rỗng) — thay
// cho toRuleHtml (thẻ card render trong iframe) vốn không hoà theme trang và luôn chừa ô trống
// cho field rỗng thay vì ẩn hẳn.
export function RuleDocumentView({ data }: { data: Partial<RuleSchema> }) {
  const any = (s?: string) => !!s?.trim();
  const filled = (items?: string[]) => (items ?? []).some((s) => s?.trim());

  const hasInfo = !!(
    data.ruleId ||
    data.name ||
    data.category ||
    data.status ||
    data.version ||
    data.effectiveDate ||
    data.owner ||
    data.source ||
    filled(data.relatedStories)
  );
  const hasStatement = any(data.statement);
  const hasLogic = any(data.when) || any(data.then);
  const hasExcept = any(data.except);
  const hasNotes = any(data.notes);

  // Đánh số section liên tục — chỉ tính những mục thật sự hiển thị.
  let counter = 0;
  const next = (show: boolean) => (show ? ++counter : 0);
  const n = {
    info: next(hasInfo),
    statement: next(hasStatement),
    logic: next(hasLogic),
    except: next(hasExcept),
    notes: next(hasNotes),
  };

  if (!counter) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Chưa có dữ liệu để xem trước.
      </p>
    );
  }

  const title = data.name
    ? `Business Rule — ${data.name}`
    : data.ruleId || "Business Rule";

  return (
    <div className="font-sans text-gray-900 w-full pb-12">
      <h1 className="text-2xl font-normal mb-8">{title}</h1>

      {hasInfo && (
        <>
          <H2 num={n.info} title="Thông tin rule" />
          <KvTable
            rows={[
              ["Rule ID", data.ruleId],
              ["Danh mục", data.category],
              [
                "Trạng thái",
                data.status ? RuleStatusLabel[data.status] : undefined,
              ],
              ["Version", data.version],
              ["Ngày hiệu lực", data.effectiveDate],
              ["Người sở hữu", data.owner],
              ["Nguồn", data.source],
              [
                "Story liên quan",
                filled(data.relatedStories)
                  ? data.relatedStories?.filter((s) => s?.trim()).join(", ")
                  : undefined,
              ],
            ]}
          />
        </>
      )}

      {hasStatement && (
        <>
          <H2 num={n.statement} title="Phát biểu (Statement)" />
          <Prose text={data.statement} />
        </>
      )}

      {hasLogic && (
        <>
          <H2 num={n.logic} title="Logic" />
          {any(data.when) && (
            <>
              <H3 num={`${n.logic}.1`} title="Điều kiện (When)" />
              <Prose text={data.when} />
            </>
          )}
          {any(data.then) && (
            <>
              <H3 num={`${n.logic}.2`} title="Hành vi (Then)" />
              <Prose text={data.then} />
            </>
          )}
        </>
      )}

      {hasExcept && (
        <>
          <H2 num={n.except} title="Ngoại lệ (Except)" />
          <Prose text={data.except} />
        </>
      )}

      {hasNotes && (
        <>
          <H2 num={n.notes} title="Ghi chú / Link logic" />
          <Prose text={data.notes} />
        </>
      )}
    </div>
  );
}
