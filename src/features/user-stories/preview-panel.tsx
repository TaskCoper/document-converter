import {
  CriteriaConditionLabel,
  PositionLabel,
  PriorityLabel,
  StatusLabel,
  type Schema,
} from "./validations";
import {
  Ban,
  BookOpen,
  Filter,
  GitBranch,
  Info,
  ListChecks,
  Network,
  Settings2,
} from "lucide-react";
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";

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
  if (!value) return null;
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

export function PreviewPanel({ control }: { control: Control<Schema> }) {
  const data = useWatch({ control }) as Partial<Schema>;

  const filled = (items?: string[]) => (items ?? []).some((s) => s?.trim());

  const meta = data.metadata;
  const showMeta = !!(
    meta?.id ||
    meta?.story ||
    meta?.context ||
    meta?.sprint ||
    meta?.creator ||
    meta?.priority ||
    meta?.status ||
    meta?.assignee?.length
  );
  const showConditions =
    filled(data.conditions?.preconditions) ||
    !!data.conditions?.trigger?.trim();
  const showFlow =
    filled(data.flow?.mainFlow) ||
    (data.flow?.alternativeFlow?.some((f) => f.steps.some((s) => s.trim())) ??
      false) ||
    (data.flow?.exceptionFlow?.some((f) => f.steps.some((s) => s.trim())) ??
      false);
  const showAC =
    Array.isArray(data.acceptanceCriteria) &&
    data.acceptanceCriteria.some(
      (ac) => ac.code?.trim() || ac.criterias?.some((c) => c.step?.trim()),
    );
  const showDiagram = !!data.activityDiagram?.trim();
  const showRefs =
    filled(data.references?.businessRules) ||
    filled(data.references?.dependencies);
  const showNonFunc = filled(data.nonFunctional);
  const showOutOfScope = filled(data.outOfScope);

  const hasAny =
    showMeta ||
    showConditions ||
    showFlow ||
    showAC ||
    showDiagram ||
    showRefs ||
    showNonFunc ||
    showOutOfScope;

  if (!hasAny) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Chưa có dữ liệu để xem trước.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-xs">
      {showMeta && (
        <PreviewSection title="Thông tin chung" icon={Info}>
          <PreviewRow label="ID" value={data.metadata?.id} />
          <PreviewRow label="Sprint" value={data.metadata?.sprint} />
          <PreviewRow
            label="Độ ưu tiên"
            value={
              data.metadata?.priority
                ? PriorityLabel[data.metadata.priority]
                : undefined
            }
          />
          <PreviewRow
            label="Trạng thái"
            value={
              data.metadata?.status
                ? StatusLabel[data.metadata.status]
                : undefined
            }
          />
          <PreviewRow label="Người tạo" value={data.metadata?.creator} />
          <PreviewBlock label="User Story" value={data.metadata?.story} />
          <PreviewBlock label="Ngữ cảnh" value={data.metadata?.context} />
          {data.metadata?.assignee && data.metadata.assignee.length > 0 && (
            <div>
              <div className="text-muted-foreground mb-1">Người phụ trách</div>
              <ul className="flex flex-col gap-0.5">
                {data.metadata.assignee.map((a, i) => (
                  <li key={i} className="wrap-break-word">
                    {a.name || <em className="text-muted-foreground">-</em>}{" "}
                    <span className="text-muted-foreground">
                      ({a.position ? PositionLabel[a.position] : "-"})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </PreviewSection>
      )}

      {showConditions && (
        <PreviewSection title="Điều kiện" icon={Filter}>
          <PreviewList
            label="Điều kiện tiên quyết"
            items={data.conditions?.preconditions}
          />
          <PreviewBlock label="Kích hoạt" value={data.conditions?.trigger} />
        </PreviewSection>
      )}

      {showFlow && (
        <PreviewSection title="Luồng xử lý" icon={GitBranch}>
          <PreviewList label="Luồng chính" items={data.flow?.mainFlow} />
          {data.flow?.alternativeFlow &&
            data.flow.alternativeFlow.length > 0 && (
              <div>
                <div className="text-muted-foreground mb-1">Luồng thay thế</div>
                <ul className="flex flex-col gap-2">
                  {data.flow.alternativeFlow.map((f, i) => (
                    <li key={i}>
                      <div className="font-medium">{f.code || `#${i + 1}`}</div>
                      <PreviewList items={f.steps} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          {data.flow?.exceptionFlow && data.flow.exceptionFlow.length > 0 && (
            <div>
              <div className="text-muted-foreground mb-1">Luồng ngoại lệ</div>
              <ul className="flex flex-col gap-2">
                {data.flow.exceptionFlow.map((f, i) => (
                  <li key={i}>
                    <div className="font-medium">{f.code || `#${i + 1}`}</div>
                    <PreviewList items={f.steps} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </PreviewSection>
      )}

      {showAC && (
        <PreviewSection title="Tiêu chí chấp nhận" icon={ListChecks}>
          <div className="flex flex-col gap-3">
            {Array.isArray(data.acceptanceCriteria) &&
              data.acceptanceCriteria.map((ac, i) => (
                <div key={i}>
                  {ac.code && <div className="font-medium mb-1">{ac.code}</div>}
                  <ul className="flex flex-col gap-1">
                    {ac.criterias
                      ?.filter((c) => c.step?.trim())
                      .map((c, ci) => (
                        <li key={ci} className="wrap-break-word">
                          <span className="font-medium">
                            {c.type ? CriteriaConditionLabel[c.type] : "-"}
                          </span>{" "}
                          {c.step}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
          </div>
        </PreviewSection>
      )}

      {showDiagram && (
        <PreviewSection title="Sơ đồ hoạt động" icon={Network}>
          {data.activityDiagram ? (
            <a
              href={data.activityDiagram}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline break-all"
            >
              {data.activityDiagram}
            </a>
          ) : (
            <span className="text-muted-foreground">Chưa có URL</span>
          )}
        </PreviewSection>
      )}

      {showRefs && (
        <PreviewSection title="Tham chiếu" icon={BookOpen}>
          <PreviewList
            label="Quy tắc nghiệp vụ"
            items={data.references?.businessRules}
          />
          <PreviewList
            label="Phụ thuộc"
            items={data.references?.dependencies}
          />
        </PreviewSection>
      )}

      {showNonFunc && (
        <PreviewSection title="Yêu cầu phi chức năng" icon={Settings2}>
          <PreviewList items={data.nonFunctional} />
        </PreviewSection>
      )}

      {showOutOfScope && (
        <PreviewSection title="Ngoài phạm vi" icon={Ban}>
          <PreviewList items={data.outOfScope} />
        </PreviewSection>
      )}
    </div>
  );
}
