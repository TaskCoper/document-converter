import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  AlertCircle,
  CheckIcon,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileCode,
  FileText,
  RefreshCcwIcon,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FieldPath } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";

import { HtmlPreviewDialog } from "./components/html-preview-dialog";
import { Button } from "./components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "./components/ui/field";
import {
  AcceptanceCriteriaSection,
  ConditionsSection,
  FlowSection,
  MetadataSection,
  ReferencesSection,
  StringListSection,
} from "./components/form-sections";
import { Input } from "./components/ui/input";
import { PreviewPanel } from "./components/preview-panel";
import {
  downloadFile,
  fromMarkdown,
  toHtml,
  toMarkdown,
  toSampleMarkdown,
} from "./exporters";
import { cn } from "./lib/utils";
import { initialData, sampleData, useFormStore } from "./store";
import { pathToLabel, schema, type Schema } from "./validations";

type StepDef = {
  title: string;
  description: string;
  fields: FieldPath<Schema>[];
};

const STEPS: StepDef[] = [
  {
    title: "Thông tin chung",
    description: "Metadata của user story",
    fields: ["metadata"],
  },
  {
    title: "Điều kiện & Luồng",
    description: "Điều kiện tiên quyết và các luồng xử lý",
    fields: ["conditions", "flow"],
  },
  {
    title: "Tiêu chí & Sơ đồ",
    description: "Tiêu chí chấp nhận và activity diagram",
    fields: ["acceptanceCriteria", "activityDiagram"],
  },
  {
    title: "Tham chiếu & Phạm vi",
    description: "Tham chiếu, yêu cầu phi chức năng, và phạm vi",
    fields: ["references", "nonFunctional", "outOfScope"],
  },
];

export default function HomePage() {
  "use no memo";
  const step = useFormStore((s) => s.step);
  const setStep = useFormStore((s) => s.setStep);
  const setData = useFormStore((s) => s.setData);
  const resetStore = useFormStore((s) => s.reset);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    reset,
    getValues,
  } = useForm<Schema>({
    resolver: standardSchemaResolver(schema),
    defaultValues: useFormStore.getState().data,
    mode: "onBlur",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string[] | null>(null);
  const [showImportValidation, setShowImportValidation] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);

  const safeFilename = (ext: string) => {
    const id = getValues("metadata.id") || "user-story";
    return `${id.replace(/[^a-zA-Z0-9._-]+/g, "_")}.${ext}`;
  };

  const onExportMd = () => {
    downloadFile(safeFilename("md"), toMarkdown(getValues()), "text/markdown");
  };

  const onDownloadSampleMd = () => {
    downloadFile("user-story-sample.md", toSampleMarkdown(), "text/markdown");
  };

  const onExportHtml = () => {
    const html = toHtml(getValues());
    if (isLast) {
      setHtmlPreview(html);
    } else {
      downloadFile(safeFilename("html"), html, "text/html");
    }
  };

  const onDownloadHtmlFromPreview = () => {
    if (htmlPreview) {
      downloadFile(safeFilename("html"), htmlPreview, "text/html");
      setHtmlPreview(null);
    }
  };

  const onImportMd = async (file: File) => {
    setImportError(null);
    setShowImportValidation(false);
    try {
      const text = await file.text();
      const parsed = fromMarkdown(text);
      reset(parsed);
      setData(parsed);
      setStep(0);
      await trigger();
      setShowImportValidation(true);
    } catch (err) {
      const e = err as Error & { messages?: string[] };
      setImportError(e.messages ?? [e.message]);
    }
  };

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const goNext = async () => {
    const ok = await trigger(current.fields);
    if (ok) setStep(step + 1);
  };

  const goBack = () => setStep(Math.max(0, step - 1));

  const onReset = () => {
    resetStore();
    reset(initialData);
  };

  const onFillSample = () => {
    reset(sampleData);
    setData(sampleData);
    setStep(0);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_32rem] gap-8">
      <div className="flex flex-col gap-6 min-w-0">
        <Stepper current={step} onSelect={setStep} />

        <div className="-space-y-0.5">
          <h2 className="text-lg font-semibold text-primary">
            Bước {step + 1}. {current.title}
          </h2>
          <p className="text-xs text-muted-foreground">{current.description}</p>
        </div>

        <form onSubmit={handleSubmit(() => {})} className="flex flex-col gap-8">
          <FormSync control={control} />

          {step === 0 && (
            <MetadataSection register={register} control={control} errors={errors} />
          )}

          {step === 1 && (
            <>
              <ConditionsSection register={register} control={control} errors={errors} />
              <FlowSection register={register} control={control} errors={errors} />
            </>
          )}

          {step === 2 && (
            <>
              <AcceptanceCriteriaSection register={register} control={control} errors={errors} />
              <FieldSet>
                <FieldLegend>Sơ đồ hoạt động</FieldLegend>
                <FieldGroup>
                  <Field data-invalid={!!errors.activityDiagram || undefined}>
                    <FieldLabel htmlFor="activityDiagram">Activity Diagram URL</FieldLabel>
                    <Input
                      id="activityDiagram"
                      type="url"
                      placeholder="https://..."
                      aria-invalid={!!errors.activityDiagram || undefined}
                      {...register("activityDiagram")}
                    />
                    {errors.activityDiagram?.message && (
                      <FieldError>{errors.activityDiagram.message}</FieldError>
                    )}
                  </Field>
                </FieldGroup>
              </FieldSet>
            </>
          )}

          {step === 3 && (
            <>
              <ReferencesSection control={control} register={register} />
              <StringListSection
                legend="Yêu cầu phi chức năng"
                description="Danh sách các yêu cầu phi chức năng"
                name="nonFunctional"
                control={control}
                register={register}
              />
              <StringListSection
                legend="Ngoài phạm vi"
                description="Các mục nằm ngoài phạm vi công việc"
                name="outOfScope"
                control={control}
                register={register}
              />
            </>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Button type="button" variant="destructive" onClick={onReset}>
              <RefreshCcwIcon />
              Đặt lại
            </Button>

            <div className="flex-1" />

            <Button type="button" variant="outline" onClick={goBack} disabled={isFirst}>
              <ChevronLeft />
              Quay lại
            </Button>

            {isLast ? (
              <Button type="submit">
                <CheckIcon />
                Xong
              </Button>
            ) : (
              <Button type="button" onClick={goNext}>
                Tiếp theo
                <ChevronRight />
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between">
          <Button type="button" size="sm" onClick={onFillSample}>
            <ClipboardList />
            Điền mẫu
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".md,text/markdown,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportMd(file);
              e.target.value = "";
            }}
          />

          <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload />
            Nhập MD
          </Button>

          <Button type="button" size="sm" onClick={onDownloadSampleMd}>
            <Download />
            Mẫu MD
          </Button>

          <Button type="button" size="sm" onClick={onExportMd}>
            <FileText />
            Xuất MD
          </Button>
          <Button type="button" size="sm" onClick={onExportHtml}>
            <FileCode />
            Xuất HTML
          </Button>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto border border-border p-4 flex flex-col gap-4">
          {importError && (
            <div
              role="alert"
              className="border border-destructive/40 bg-destructive/5 text-destructive text-xs p-2"
            >
              <div className="font-medium mb-1 flex items-center gap-1">
                <Download className="size-3" />
                Không thể nhập file
              </div>
              <ul className="list-disc list-inside flex flex-col gap-0.5 ml-0.5">
                {importError.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {showImportValidation && (() => {
            const msgs = flattenErrors(errors);
            return msgs.length > 0 ? (
              <div
                role="alert"
                className="border border-destructive/40 bg-destructive/5 text-destructive text-xs p-2"
              >
                <div className="font-medium mb-1 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  Dữ liệu nhập có lỗi ({msgs.length})
                </div>
                <ul className="list-disc list-inside flex flex-col gap-0.5 ml-0.5">
                  {msgs.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            ) : null;
          })()}

          <PreviewPanel control={control} />
        </aside>
      </div>

      <HtmlPreviewDialog
        html={htmlPreview}
        onClose={() => setHtmlPreview(null)}
        onDownload={onDownloadHtmlFromPreview}
      />
    </div>
  );
}

function flattenErrors(obj: unknown, path: (string | number)[] = []): string[] {
  if (!obj || typeof obj !== "object") return [];
  if ("message" in (obj as object)) {
    const msg = (obj as { message?: unknown }).message;
    if (typeof msg === "string" && msg) {
      const label = pathToLabel(path);
      return [label ? `${label}: ${msg}` : msg];
    }
    return [];
  }
  const msgs: string[] = [];
  for (const [key, val] of Object.entries(obj as object)) {
    const segment: string | number = isNaN(Number(key)) ? key : Number(key);
    const nextPath = [...path, segment];
    if (Array.isArray(val)) {
      val.forEach((item, i) => msgs.push(...flattenErrors(item, [...nextPath, i])));
    } else {
      msgs.push(...flattenErrors(val, nextPath));
    }
  }
  return msgs;
}

function FormSync({ control }: { control: ReturnType<typeof useForm<Schema>>["control"] }) {
  const values = useWatch({ control });
  const setData = useFormStore((s) => s.setData);

  useEffect(() => {
    setData(values as Schema);
  }, [values, setData]);

  return null;
}

function Stepper({
  current,
  onSelect,
}: {
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const isActive = i === current;
        const isDone = i < current;
        return (
          <li key={s.title} className="flex-1">
            <button
              type="button"
              onClick={() => onSelect(i)}
              className={cn(
                "w-full flex flex-col items-start gap-1 border-t-2 pt-2 text-left transition-colors",
                isActive && "border-primary",
                isDone && "border-primary/60",
                !isActive && !isDone && "border-border hover:border-foreground/30",
              )}
            >
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wide",
                  isActive ? "text-primary" : isDone ? "text-primary/70" : "text-muted-foreground",
                )}
              >
                Bước {i + 1}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  !isActive && !isDone && "text-muted-foreground",
                )}
              >
                {s.title}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
