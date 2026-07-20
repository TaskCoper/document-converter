import {
  AlertTriangle,
  BookOpen,
  FileText,
  Info,
  Scale,
  StickyNote,
  Zap,
} from "lucide-react";
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { RuleStatusLabel, type RuleSchema } from "../validations";

function PreviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-3 text-primary shrink-0" />}
        <h4 className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground shrink-0">
          {title}
        </h4>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="wrap-break-word">
        {value !== undefined && value !== "" ? (
          value
        ) : (
          <em className="text-muted-foreground">-</em>
        )}
      </span>
    </div>
  );
}

function PreviewBlock({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <div className="text-muted-foreground mb-0.5">{label}</div>
      <p className="whitespace-pre-wrap wrap-break-word">{value}</p>
    </div>
  );
}

function PreviewList({ label, items }: { label?: string; items?: string[] }) {
  const filled = items?.filter((s) => s && s.trim().length > 0);
  if (!filled || filled.length === 0) return null;
  return (
    <div>
      {label && <div className="text-muted-foreground mb-1">{label}</div>}
      <ul className="list-disc ml-4 flex flex-col gap-0.5">
        {filled.map((item, i) => (
          <li key={i} className="wrap-break-word">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RulePreviewPanel({
  control,
}: {
  control: Control<RuleSchema>;
}) {
  const data = useWatch({ control }) as Partial<RuleSchema>;

  const filled = (items?: string[]) => (items ?? []).some((s) => s?.trim());

  const showIdentity = !!(
    data.ruleId ||
    data.name ||
    data.category ||
    data.status ||
    data.version ||
    data.effectiveDate
  );
  const showStatement = !!data.statement?.trim();
  const showLogic = !!(data.when?.trim() || data.then?.trim());
  const showExcept = !!data.except?.trim();
  const showGovernance = !!(
    data.source?.trim() ||
    data.owner?.trim() ||
    filled(data.relatedStories)
  );
  const showNotes = !!data.notes?.trim();

  const hasAny =
    showIdentity ||
    showStatement ||
    showLogic ||
    showExcept ||
    showGovernance ||
    showNotes;

  if (!hasAny) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Chưa có dữ liệu để xem trước.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-xs">
      {showIdentity && (
        <PreviewSection title="Định danh & Phân loại" icon={Info}>
          <PreviewRow label="Rule ID" value={data.ruleId} />
          <PreviewRow label="Tên rule" value={data.name} />
          <PreviewRow label="Danh mục" value={data.category} />
          <PreviewRow
            label="Trạng thái"
            value={data.status ? RuleStatusLabel[data.status] : undefined}
          />
          <PreviewRow label="Version" value={data.version} />
          <PreviewRow label="Ngày hiệu lực" value={data.effectiveDate} />
        </PreviewSection>
      )}

      {showStatement && (
        <PreviewSection title="Phát biểu" icon={FileText}>
          <PreviewBlock label="Statement" value={data.statement} />
        </PreviewSection>
      )}

      {showLogic && (
        <PreviewSection title="Logic" icon={Zap}>
          <PreviewBlock label="Điều kiện (When)" value={data.when} />
          <PreviewBlock label="Hành vi (Then)" value={data.then} />
        </PreviewSection>
      )}

      {showExcept && (
        <PreviewSection title="Ngoại lệ" icon={AlertTriangle}>
          <PreviewBlock label="Except" value={data.except} />
        </PreviewSection>
      )}

      {showGovernance && (
        <PreviewSection title="Quản trị & Tham chiếu" icon={Scale}>
          <PreviewRow label="Nguồn" value={data.source} />
          <PreviewRow label="Người sở hữu" value={data.owner} />
          <PreviewList
            label="Story liên quan"
            items={data.relatedStories}
          />
        </PreviewSection>
      )}

      {showNotes && (
        <PreviewSection title="Ghi chú" icon={StickyNote}>
          <PreviewBlock label="Notes / Link logic" value={data.notes} />
        </PreviewSection>
      )}

      {!showGovernance && filled(data.relatedStories) && (
        <PreviewSection title="Tham chiếu" icon={BookOpen}>
          <PreviewList
            label="Story liên quan"
            items={data.relatedStories}
          />
        </PreviewSection>
      )}
    </div>
  );
}
