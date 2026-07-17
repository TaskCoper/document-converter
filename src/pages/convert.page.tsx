import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckIcon,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileCode,
  FileText,
  Folder,
  RefreshCcwIcon,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FieldPath } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { Spinner } from "@/components/ui/spinner";
import {
  AcceptanceCriteriaSection,
  ConditionsSection,
  FlowSection,
  MetadataSection,
  ReferencesSection,
  StringListSection,
} from "../components/form-sections";
import { HtmlPreviewDialog } from "../components/html-preview-dialog";
import { PreviewPanel } from "../components/preview-panel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../components/ui/field";
import { Input } from "../components/ui/input";
import {
  downloadFile,
  fromMarkdown,
  toHtml,
  toMarkdown,
  toSampleMarkdown,
} from "../exporters";
import { getFile, slugifyAuthor } from "../lib/github";
import {
  ghKeys,
  messageFor,
  parentOf,
  useDir,
  useFile,
  useRenameFile,
  useSaveFile,
} from "../lib/queries";
import { cn } from "../lib/utils";
import {
  initialData,
  sampleData,
  useAuthorStore,
  useFormStore,
} from "../store";
import { pathToLabel, schema, type Schema } from "../validations";

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

export default function ConvertPage() {
  const { "*": editPathRaw = "" } = useParams();
  const editPath = editPathRaw.replace(/^\/+|\/+$/g, "");
  const isEdit = editPath.length > 0;
  const navigate = useNavigate();

  const editFolder = parentOf(editPath);
  const [editNewFilename, setEditNewFilename] = useState(
    () => editPath.split("/").pop() ?? "",
  );
  const editNewPath = editFolder
    ? `${editFolder}/${editNewFilename}`
    : editNewFilename;
  const isRename = isEdit && editNewPath !== editPath;

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
    setValue,
  } = useForm<Schema>({
    resolver: standardSchemaResolver(schema),
    defaultValues: useFormStore.getState().data,
    mode: "onBlur",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string[] | null>(null);
  const [showImportValidation, setShowImportValidation] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [commitOutcome, setCommitOutcome] = useState<
    | { kind: "success"; path: string; created: boolean }
    | { kind: "error"; message: string }
    | null
  >(null);

  const [editSeededSha, setEditSeededSha] = useState<string | null>(null);
  const [editOriginal, setEditOriginal] = useState<Schema | null>(null);
  const [editLoadError, setEditLoadError] = useState<string[] | null>(null);

  const [searchParams] = useSearchParams();
  const [folderInput, setFolderInput] = useState(
    () => searchParams.get("folder") ?? "",
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const editFile = useFile(editPath, isEdit);
  const author = useAuthorStore((s) => s.name);
  const save = useSaveFile();
  const rename = useRenameFile();
  const qc = useQueryClient();

  const metadataId = useWatch({ control, name: "metadata.id" });

  useEffect(() => {
    if (isEdit) return;
    if (author && getValues("metadata.creator") !== author) {
      setValue("metadata.creator", author, { shouldValidate: false });
    }
  }, [author, setValue, getValues, isEdit]);

  if (isEdit && editFile.data && editFile.data.sha !== editSeededSha) {
    try {
      const parsed = fromMarkdown(editFile.data.content);
      reset(parsed);
      setEditOriginal(parsed);
      setEditSeededSha(editFile.data.sha);
      setEditLoadError(null);
      setStep(0);
    } catch (err) {
      const e = err as Error & { messages?: string[] };
      setEditLoadError(e.messages ?? [e.message]);
      setEditSeededSha(editFile.data.sha);
    }
  }

  const safeFilename = (ext: string) => {
    const id = getValues("metadata.id") || "user-story";
    return `${id.replace(/[^a-zA-Z0-9._-]+/g, "_")}.${ext}`;
  };

  const commitPath = () => {
    if (isEdit) return editPath;
    const id = getValues("metadata.id") || "user-story";
    const safeId = id.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const folder = folderInput.trim() || slugifyAuthor(author);
    return `${folder}/${safeId}.md`;
  };

  const onCommit = async (data: Schema) => {
    setCommitOutcome(null);
    if (!author) {
      setCommitOutcome({
        kind: "error",
        message: "Cần đặt tên hiển thị trước khi commit.",
      });
      return;
    }
    const path = commitPath();

    if (isEdit) {
      const content = toMarkdown(data);

      if (isRename) {
        try {
          const renameMsg = `Rename ${editPath} → ${editNewPath}\n\nContent updated and renamed by ${author} on the web.`;
          await rename.mutateAsync({
            oldPath: editPath,
            newPath: editNewPath,
            content,
            message: renameMsg,
            websiteUser: author,
          });
          navigate(`/view/${editNewPath}`);
        } catch (e) {
          setCommitOutcome({ kind: "error", message: messageFor(e) });
        }
        return;
      }

      const message = buildEditCommitMessage(
        editPath,
        editOriginal,
        data,
        author,
      );
      try {
        await save.mutateAsync({
          path: editPath,
          content,
          message,
          websiteUser: author,
        });
        navigate(`/view/${editPath}`);
      } catch (e) {
        setCommitOutcome({ kind: "error", message: messageFor(e) });
      }
      return;
    }

    const content = toMarkdown({
      ...data,
      metadata: { ...data.metadata, creator: author },
    });
    try {
      const existing = await qc.fetchQuery({
        queryKey: ghKeys.file(path),
        queryFn: () => getFile(path),
      });
      await save.mutateAsync({
        path,
        content,
        message: buildCreateCommitMessage(path, data, author, !!existing),
        websiteUser: author,
      });
      resetStore();
      reset(initialData);
      navigate(`/view/${path}`);
    } catch (e) {
      setCommitOutcome({ kind: "error", message: messageFor(e) });
    }
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
    if (isEdit) {
      if (editOriginal) {
        reset(editOriginal);
      }

      setStep(0);
      setCommitOutcome(null);
      return;
    }

    resetStore();
    reset(initialData);
  };

  const onFillSample = () => {
    reset(sampleData);
    setData(sampleData);
    setStep(0);
  };

  return (
    <div className="py-4 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_32rem] gap-8 lg:h-full lg:overflow-hidden">
      <div className="flex flex-col gap-6 min-w-0 lg:min-h-0 lg:overflow-hidden">
        {isEdit && (
          <EditHeader
            path={editPath}
            loading={editFile.isPending}
            notFound={
              !editFile.isPending && !editFile.error && editFile.data === null
            }
            fetchError={editFile.error ? messageFor(editFile.error) : null}
            parseError={editLoadError}
          />
        )}

        {isEdit && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-mono shrink-0">
              {editFolder}/
            </span>

            <Input
              value={editNewFilename}
              onChange={(e) =>
                setEditNewFilename(
                  e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""),
                )
              }
              className="h-7 text-xs font-mono max-w-[18rem]"
              placeholder="filename.md"
            />

            {isRename && (
              <span className="text-xs text-amber-600 shrink-0">
                ← đổi tên file
              </span>
            )}
          </div>
        )}

        <Stepper current={step} onSelect={setStep} />

        <div className="-space-y-0.5">
          <h2 className="text-lg font-semibold text-primary">
            Bước {step + 1}. {current.title}
          </h2>
          <p className="text-xs text-muted-foreground">{current.description}</p>
        </div>

        <form className="flex flex-col gap-8 lg:flex-1 lg:min-h-0">
          {!isEdit && <FormSync control={control} />}

          <div className="flex flex-col gap-8 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
            {step === 0 && (
              <MetadataSection
                register={register}
                control={control}
                errors={errors}
              />
            )}

            {step === 1 && (
              <>
                <ConditionsSection
                  register={register}
                  control={control}
                  errors={errors}
                />
                <FlowSection
                  register={register}
                  control={control}
                  errors={errors}
                />
              </>
            )}

            {step === 2 && (
              <>
                <AcceptanceCriteriaSection
                  register={register}
                  control={control}
                  errors={errors}
                />
                <FieldSet>
                  <FieldLegend>Sơ đồ hoạt động</FieldLegend>
                  <FieldGroup>
                    <Field data-invalid={!!errors.activityDiagram || undefined}>
                      <FieldLabel htmlFor="activityDiagram">
                        Activity Diagram URL
                      </FieldLabel>
                      <Input
                        id="activityDiagram"
                        type="url"
                        placeholder="https://..."
                        aria-invalid={!!errors.activityDiagram || undefined}
                        {...register("activityDiagram")}
                      />
                      {errors.activityDiagram?.message && (
                        <FieldError>
                          {errors.activityDiagram.message}
                        </FieldError>
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
          </div>

          {!isEdit && isLast && (
            <FolderPicker
              authorSlug={slugifyAuthor(author)}
              value={folderInput}
              onChange={setFolderInput}
              fileId={metadataId || ""}
            />
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Button type="button" variant="destructive" onClick={onReset}>
              <RefreshCcwIcon />
              Đặt lại
            </Button>

            <div className="flex-1" />

            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={isFirst}
            >
              <ChevronLeft />
              Quay lại
            </Button>

            {isLast ? (
              <Button
                type="button"
                onClick={async () => {
                  const valid = await trigger();
                  if (valid) setConfirmOpen(true);
                }}
                disabled={save.isPending || rename.isPending || !author}
              >
                {save.isPending || rename.isPending ? (
                  <Spinner />
                ) : (
                  <CheckIcon />
                )}
                {isRename ? "Đổi tên & Commit" : "Xong & Commit"}
              </Button>
            ) : (
              <Button type="button" onClick={goNext}>
                Tiếp theo
                <ChevronRight />
              </Button>
            )}
          </div>

          {isLast && !author && (
            <p className="text-xs text-destructive">
              Cần đặt tên hiển thị (ở góc trên bên phải) trước khi commit.
            </p>
          )}
          {commitOutcome?.kind === "error" && (
            <p className="text-xs text-destructive">{commitOutcome.message}</p>
          )}
        </form>
      </div>

      <div className="flex flex-col gap-2 lg:min-h-0 lg:overflow-hidden">
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

          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
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

        <aside className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto border border-border p-4 flex flex-col gap-4">
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

          {showImportValidation &&
            (() => {
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRename
                ? "Đổi tên & Commit?"
                : isEdit
                  ? "Lưu thay đổi?"
                  : "Tạo file mới?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRename ? (
                <>
                  File sẽ được đổi tên và nội dung sẽ được cập nhật tại{" "}
                  <code className="text-foreground">{editNewPath}</code>.
                </>
              ) : isEdit ? (
                <>
                  Thay đổi sẽ được commit lên{" "}
                  <code className="text-foreground">{editPath}</code>.
                </>
              ) : (
                <>
                  File sẽ được tạo tại{" "}
                  <code className="text-foreground">{commitPath()}</code>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit(onCommit)}
              disabled={save.isPending || rename.isPending}
            >
              {save.isPending || rename.isPending ? <Spinner /> : null}
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FolderPicker({
  authorSlug,
  value,
  onChange,
  fileId,
}: {
  authorSlug: string;
  value: string;
  onChange: (v: string) => void;
  fileId: string;
}) {
  const { data: entries } = useDir("");
  const folders =
    entries?.filter((e) => e.type === "dir").map((e) => e.name) ?? [];
  const effective = value.trim() || authorSlug;
  const safeFileId = (fileId || "user-story").replace(/[^a-zA-Z0-9._-]+/g, "_");

  return (
    <div className="flex flex-col gap-2 border border-border bg-muted/20 p-3">
      <p className="text-xs font-medium">Lưu vào thư mục</p>
      {folders.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {folders.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onChange(name)}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 text-xs border rounded transition-colors",
                effective === name
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-foreground/30",
              )}
            >
              <Folder className="size-3" />
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <Input
          type="text"
          value={value}
          onChange={(e) =>
            onChange(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))
          }
          placeholder={authorSlug}
          className="h-7 text-xs max-w-[16rem]"
        />
        <span className="text-xs text-muted-foreground shrink-0">
          / {safeFileId}.md
        </span>
      </div>
    </div>
  );
}

function EditHeader({
  path,
  loading,
  notFound,
  fetchError,
  parseError,
}: {
  path: string;
  loading: boolean;
  notFound: boolean;
  fetchError: string | null;
  parseError: string[] | null;
}) {
  const parent = parentOf(path);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 border border-dashed border-primary bg-primary/10 px-3 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] uppercase tracking-wide text-primary">
            Đang chỉnh sửa
          </span>

          <code className="truncate text-sm font-semibold text-primary">
            {path}
          </code>
        </div>

        <Link
          to={`/browse/${parent}`}
          className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-primary hover:underline"
        >
          <ArrowLeft className="size-3" />
          Quay lại thư mục
        </Link>
      </div>

      {loading && (
        <p className="text-xs text-muted-foreground">Đang tải file…</p>
      )}

      {notFound && (
        <p className="text-xs text-destructive">
          Không tìm thấy file <code>{path}</code>.
        </p>
      )}

      {fetchError && <p className="text-xs text-destructive">{fetchError}</p>}

      {parseError && parseError.length > 0 && (
        <div
          role="alert"
          className="border border-destructive/40 bg-destructive/5 text-destructive text-xs p-2"
        >
          <div className="font-medium mb-1 flex items-center gap-1">
            <AlertCircle className="size-3" />
            Không thể đọc file theo lược đồ user story
          </div>
          <ul className="list-disc list-inside flex flex-col gap-0.5 ml-0.5">
            {parseError.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
          <p className="mt-1">
            Bạn có thể{" "}
            <Link
              to={`/file/${path}`}
              className="underline hover:text-destructive/80"
            >
              chỉnh sửa văn bản thô
            </Link>{" "}
            thay vì dùng form.
          </p>
        </div>
      )}
    </div>
  );
}

function buildCreateCommitMessage(
  _path: string,
  data: Schema,
  author: string,
  isUpdate: boolean,
): string {
  const storyId = data.metadata.id;
  const storyTitle = data.metadata.story;
  const titleParts = [storyId, storyTitle].filter(Boolean);
  const title =
    titleParts.length > 0 ? titleParts.join(" \u2013 ") : "user story";
  const parts: string[] = [title, ""];
  parts.push(`Author: ${author}`);
  const sprintPriority = [
    data.metadata.sprint ? `Sprint: ${data.metadata.sprint}` : "",
    data.metadata.priority ? `Priority: ${data.metadata.priority}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  if (sprintPriority) parts.push(sprintPriority);
  if (data.metadata.status) parts.push(`Status: ${data.metadata.status}`);
  const action = isUpdate ? "Update" : "Create";
  parts.push("", `${action}d by ${author} on the web.`);
  return parts.join("\n");
}

function buildEditCommitMessage(
  path: string,
  original: Schema | null,
  next: Schema,
  websiteUser: string,
): string {
  const header = `Update ${path} via user-story form`;
  const footer = `Edited by ${websiteUser} on the web.`;
  if (!original) return `${header}\n\n${footer}`;
  const changes = summarizeChanges(original, next);
  if (changes.length === 0)
    return `${header}\n\nNo field-level changes detected.\n\n${footer}`;
  return `${header}\n\nChanges:\n${changes.map((c) => `- ${c}`).join("\n")}\n\n${footer}`;
}

function summarizeChanges(prev: Schema, next: Schema): string[] {
  const eq = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);
  const countChange = (before: unknown[], after: unknown[]) =>
    `${before.length}→${after.length}`;
  const lines: string[] = [];

  const metaFields: (keyof Schema["metadata"])[] = [
    "id",
    "story",
    "context",
    "sprint",
    "priority",
    "assignee",
    "creator",
    "status",
  ];
  const metaChanged = metaFields.filter(
    (f) => !eq(prev.metadata[f], next.metadata[f]),
  );
  if (metaChanged.length) lines.push(`metadata: ${metaChanged.join(", ")}`);

  const condChanged: string[] = [];
  if (!eq(prev.conditions.preconditions, next.conditions.preconditions))
    condChanged.push(
      `preconditions (${countChange(prev.conditions.preconditions, next.conditions.preconditions)})`,
    );
  if (prev.conditions.trigger !== next.conditions.trigger)
    condChanged.push("trigger");
  if (condChanged.length) lines.push(`conditions: ${condChanged.join(", ")}`);

  const flowChanged: string[] = [];
  if (!eq(prev.flow.mainFlow, next.flow.mainFlow))
    flowChanged.push(
      `mainFlow (${countChange(prev.flow.mainFlow, next.flow.mainFlow)} steps)`,
    );
  if (!eq(prev.flow.alternativeFlow, next.flow.alternativeFlow))
    flowChanged.push(
      `alternativeFlow (${countChange(prev.flow.alternativeFlow, next.flow.alternativeFlow)})`,
    );
  if (!eq(prev.flow.exceptionFlow, next.flow.exceptionFlow))
    flowChanged.push(
      `exceptionFlow (${countChange(prev.flow.exceptionFlow, next.flow.exceptionFlow)})`,
    );
  if (flowChanged.length) lines.push(`flow: ${flowChanged.join(", ")}`);

  if (!eq(prev.acceptanceCriteria, next.acceptanceCriteria))
    lines.push(
      `acceptanceCriteria (${countChange(prev.acceptanceCriteria, next.acceptanceCriteria)})`,
    );

  if (prev.activityDiagram !== next.activityDiagram)
    lines.push("activityDiagram");

  const refChanged: string[] = [];
  if (!eq(prev.references.businessRules, next.references.businessRules))
    refChanged.push(
      `businessRules (${countChange(prev.references.businessRules, next.references.businessRules)})`,
    );
  if (!eq(prev.references.dependencies, next.references.dependencies))
    refChanged.push(
      `dependencies (${countChange(prev.references.dependencies, next.references.dependencies)})`,
    );
  if (refChanged.length) lines.push(`references: ${refChanged.join(", ")}`);

  if (!eq(prev.nonFunctional, next.nonFunctional))
    lines.push(
      `nonFunctional (${countChange(prev.nonFunctional, next.nonFunctional)})`,
    );

  if (!eq(prev.outOfScope, next.outOfScope))
    lines.push(`outOfScope (${countChange(prev.outOfScope, next.outOfScope)})`);

  return lines;
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
      val.forEach((item, i) =>
        msgs.push(...flattenErrors(item, [...nextPath, i])),
      );
    } else {
      msgs.push(...flattenErrors(val, nextPath));
    }
  }
  return msgs;
}

function FormSync({
  control,
}: {
  control: ReturnType<typeof useForm<Schema>>["control"];
}) {
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
                "cursor-pointer w-full flex flex-col items-start gap-1 border-t-2 pt-2 text-left transition-colors",
                isActive && "border-primary",
                isDone && "border-primary/60",
                !isActive &&
                  !isDone &&
                  "border-border hover:border-foreground/30",
              )}
            >
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wide",
                  isActive
                    ? "text-primary"
                    : isDone
                      ? "text-primary/70"
                      : "text-muted-foreground",
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
