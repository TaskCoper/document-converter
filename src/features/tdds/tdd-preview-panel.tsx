import {
  AlertOctagon,
  BookOpen,
  Boxes,
  Cable,
  Database,
  GitBranch,
  History,
  Info,
  Network,
  Target,
  Workflow,
} from "lucide-react";
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { DocStatusLabel, type TddSchema } from "./validations";

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

function DiagramPreview({
  title,
  icon,
  data,
}: {
  title: string;
  icon: React.ElementType;
  data?: TddSchema["architecture"];
}) {
  const hasContent =
    !!data?.description?.trim() || !!data?.url?.trim() || (data?.notes?.length ?? 0) > 0;
  if (!hasContent) return null;
  return (
    <PreviewSection title={title} icon={icon}>
      <PreviewBlock label="Mô tả" value={data?.description} />
      {data?.url?.trim() && (
        <div>
          <div className="text-muted-foreground mb-0.5">URL</div>
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline break-all"
          >
            {data.url}
          </a>
        </div>
      )}
      <PreviewList label="Ghi chú" items={data?.notes} />
    </PreviewSection>
  );
}

export function TddPreviewPanel({ control }: { control: Control<TddSchema> }) {
  const data = useWatch({ control }) as Partial<TddSchema>;
  const filled = (items?: string[]) => (items ?? []).some((s) => s?.trim());

  const info = data.documentInfo;
  const showInfo = !!(
    info?.docId ||
    info?.feature ||
    info?.author ||
    info?.reviewer ||
    info?.version ||
    info?.updatedAt ||
    filled(info?.relatedStories) ||
    filled(info?.businessRules)
  );

  const ctx = data.contextGoals;
  const showCtx =
    !!ctx?.problem?.trim() || filled(ctx?.goals) || filled(ctx?.nonGoals);

  const internal = data.internalApi;
  const showInternal =
    (internal?.endpoints?.length ?? 0) > 0 ||
    (internal?.examples?.length ?? 0) > 0 ||
    (internal?.errorCodes?.length ?? 0) > 0;

  const external = data.externalApi;
  const showExternal =
    (external?.endpoints?.length ?? 0) > 0 ||
    (external?.fields?.length ?? 0) > 0 ||
    !!external?.errorHandling?.trim() ||
    filled(external?.quirks);

  const refs = data.references;
  const showRefs =
    filled(refs?.userStories) ||
    filled(refs?.businessRules) ||
    filled(refs?.useCases) ||
    filled(refs?.others);

  const showChangeLog =
    Array.isArray(data.changeLog) &&
    data.changeLog.some(
      (c) => c.version?.trim() || c.date?.trim() || c.change?.trim(),
    );

  const anyDiagram =
    !!data.architecture?.description?.trim() ||
    !!data.architecture?.url?.trim() ||
    (data.architecture?.notes?.length ?? 0) > 0 ||
    !!data.sequenceDiagram?.description?.trim() ||
    !!data.sequenceDiagram?.url?.trim() ||
    (data.sequenceDiagram?.notes?.length ?? 0) > 0 ||
    !!data.activityDiagram?.description?.trim() ||
    !!data.activityDiagram?.url?.trim() ||
    (data.activityDiagram?.notes?.length ?? 0) > 0 ||
    !!data.stateDiagram?.description?.trim() ||
    !!data.stateDiagram?.url?.trim() ||
    (data.stateDiagram?.notes?.length ?? 0) > 0 ||
    !!data.dataModel?.description?.trim() ||
    !!data.dataModel?.url?.trim() ||
    (data.dataModel?.notes?.length ?? 0) > 0;

  const hasAny =
    showInfo ||
    showCtx ||
    anyDiagram ||
    showInternal ||
    showExternal ||
    showRefs ||
    showChangeLog;

  if (!hasAny) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Chưa có dữ liệu để xem trước.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-xs">
      {showInfo && (
        <PreviewSection title="Thông tin tài liệu" icon={Info}>
          <PreviewRow label="Mã tài liệu" value={info?.docId} />
          <PreviewRow label="Tính năng" value={info?.feature} />
          <PreviewRow label="Tác giả" value={info?.author} />
          <PreviewRow label="Người review" value={info?.reviewer} />
          <PreviewRow
            label="Trạng thái"
            value={info?.status ? DocStatusLabel[info.status] : undefined}
          />
          <PreviewRow label="Phiên bản" value={info?.version} />
          <PreviewRow label="Cập nhật" value={info?.updatedAt} />
          <PreviewList
            label="Story liên quan"
            items={info?.relatedStories}
          />
          <PreviewList
            label="Business Rules"
            items={info?.businessRules}
          />
        </PreviewSection>
      )}

      {showCtx && (
        <PreviewSection title="Bối cảnh & Mục tiêu" icon={Target}>
          <PreviewBlock label="Vấn đề" value={ctx?.problem} />
          <PreviewList label="Mục tiêu" items={ctx?.goals} />
          <PreviewList label="Ngoài phạm vi" items={ctx?.nonGoals} />
        </PreviewSection>
      )}

      <DiagramPreview
        title="Kiến trúc"
        icon={Boxes}
        data={data.architecture as TddSchema["architecture"] | undefined}
      />
      <DiagramPreview
        title="Sequence Diagram"
        icon={Workflow}
        data={data.sequenceDiagram as TddSchema["architecture"] | undefined}
      />
      <DiagramPreview
        title="Activity Diagram"
        icon={GitBranch}
        data={data.activityDiagram as TddSchema["architecture"] | undefined}
      />
      <DiagramPreview
        title="State Diagram"
        icon={Network}
        data={data.stateDiagram as TddSchema["architecture"] | undefined}
      />
      <DiagramPreview
        title="Mô hình dữ liệu"
        icon={Database}
        data={data.dataModel as TddSchema["architecture"] | undefined}
      />

      {showInternal && (
        <PreviewSection title="API nội bộ" icon={Cable}>
          {(internal?.endpoints?.length ?? 0) > 0 && (
            <div>
              <div className="text-muted-foreground mb-1">Endpoints</div>
              <ul className="flex flex-col gap-1">
                {internal?.endpoints?.map((e, i) => (
                  <li key={i} className="wrap-break-word">
                    <span className="font-mono font-medium">
                      {e.method} {e.endpoint}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      — {e.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(internal?.examples?.length ?? 0) > 0 && (
            <div>
              <div className="text-muted-foreground mb-1">Ví dụ</div>
              <ul className="flex flex-col gap-2">
                {internal?.examples?.map((ex, i) => (
                  <li key={i}>
                    <div className="font-medium mb-0.5">{ex.title}</div>
                    <pre className="bg-muted/40 p-2 text-[10px] font-mono overflow-x-auto whitespace-pre">
                      {ex.content}
                    </pre>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(internal?.errorCodes?.length ?? 0) > 0 && (
            <div>
              <div className="text-muted-foreground mb-1">Mã lỗi</div>
              <ul className="list-disc ml-4 flex flex-col gap-0.5">
                {internal?.errorCodes?.map((ec, i) => (
                  <li key={i} className="wrap-break-word">
                    <span className="font-mono font-medium">{ec.code}</span>{" "}
                    <span className="text-muted-foreground">
                      ({ec.http}): {ec.when}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </PreviewSection>
      )}

      {showExternal && (
        <PreviewSection title="API bên ngoài" icon={AlertOctagon}>
          {(external?.endpoints?.length ?? 0) > 0 && (
            <div>
              <div className="text-muted-foreground mb-1">Endpoints</div>
              <ul className="flex flex-col gap-0.5">
                {external?.endpoints?.map((e, i) => (
                  <li key={i} className="wrap-break-word">
                    <span className="font-medium">{e.endpoint}</span>{" "}
                    <span className="text-muted-foreground">— {e.purpose}</span>
                    {e.note && (
                      <span className="text-muted-foreground"> ({e.note})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(external?.fields?.length ?? 0) > 0 && (
            <div>
              <div className="text-muted-foreground mb-1">Fields</div>
              <ul className="flex flex-col gap-0.5">
                {external?.fields?.map((f, i) => (
                  <li key={i} className="wrap-break-word">
                    <span className="font-mono font-medium">{f.field}</span>{" "}
                    <span className="text-muted-foreground">— {f.meaning}</span>
                    {f.note && (
                      <span className="text-muted-foreground"> ({f.note})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <PreviewBlock label="Xử lý lỗi" value={external?.errorHandling} />
          <PreviewList label="Quirks" items={external?.quirks} />
        </PreviewSection>
      )}

      {showRefs && (
        <PreviewSection title="Tham chiếu" icon={BookOpen}>
          <PreviewList label="User Stories" items={refs?.userStories} />
          <PreviewList label="Business Rules" items={refs?.businessRules} />
          <PreviewList label="Use Cases" items={refs?.useCases} />
          <PreviewList label="Khác" items={refs?.others} />
        </PreviewSection>
      )}

      {showChangeLog && (
        <PreviewSection title="Lịch sử thay đổi" icon={History}>
          <ul className="flex flex-col gap-1">
            {data.changeLog?.map((c, i) => (
              <li key={i} className="wrap-break-word">
                <span className="font-medium">
                  {c.version} {c.date && `(${c.date})`}
                </span>{" "}
                <span className="text-muted-foreground">
                  — {c.change}
                  {c.author && ` (${c.author})`}
                </span>
              </li>
            ))}
          </ul>
        </PreviewSection>
      )}
    </div>
  );
}
