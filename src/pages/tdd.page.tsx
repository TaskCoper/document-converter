import { HtmlPreviewDialog } from "@/components/html-preview-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuthorStore } from "@/features/user-stories/store";
import { getFile, slugifyAuthor } from "@/lib/github";
import {
  ghKeys,
  messageFor,
  parentOf,
  useDir,
  useFile,
  useRenameFile,
  useSaveFile,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
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
import {
  downloadFile,
  fromTddMarkdown,
  TddParseError,
  toTddHtml,
  toTddMarkdown,
  toTddSampleMarkdown,
} from "../features/tdds/exporters";
import {
  initialTddData,
  sampleTddData,
  useTddFormStore,
} from "../features/tdds/store";
import {
  ChangeLogSection,
  ContextGoalsSection,
  DiagramSection,
  DocumentInfoSection,
  ExternalApiSection,
  InternalApiSection,
  ReferencesSection,
} from "../features/tdds/tdd-form-sections";
import { TddPreviewPanel } from "../features/tdds/tdd-preview-panel";
import {
  pathToLabel,
  tddSchema,
  type TddSchema,
} from "../features/tdds/validations";

type StepDef = {
  title: string;
  description: string;
  fields: FieldPath<TddSchema>[];
};

const STEPS: StepDef[] = [
  {
    title: "Thông tin & Bối cảnh",
    description: "Thông tin tài liệu, vấn đề và mục tiêu",
    fields: ["documentInfo", "contextGoals"],
  },
  {
    title: "Kiến trúc & Sơ đồ",
    description: "Architecture, Sequence, Activity, State và Data Model",
    fields: [
      "architecture",
      "sequenceDiagram",
      "activityDiagram",
      "stateDiagram",
      "dataModel",
    ],
  },
  {
    title: "API nội bộ",
    description: "Endpoints, ví dụ request/response, mã lỗi",
    fields: ["internalApi"],
  },
  {
    title: "API bên ngoài",
    description: "Endpoints đối tác, field quan trọng, quirks",
    fields: ["externalApi"],
  },
  {
    title: "Tham chiếu & Lịch sử",
    description: "Tham chiếu và lịch sử thay đổi",
    fields: ["references", "changeLog"],
  },
];

export default function TddPage() {
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

  const step = useTddFormStore((s) => s.step);
  const setStep = useTddFormStore((s) => s.setStep);
  const setData = useTddFormStore((s) => s.setData);
  const resetStore = useTddFormStore((s) => s.reset);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    reset,
    getValues,
    setValue,
  } = useForm<TddSchema>({
    resolver: standardSchemaResolver(tddSchema),
    defaultValues: useTddFormStore.getState().data,
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
  const [editOriginal, setEditOriginal] = useState<TddSchema | null>(null);
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

  const docId = useWatch({ control, name: "documentInfo.docId" });

  useEffect(() => {
    if (isEdit) return;
    if (author && getValues("documentInfo.author") !== author) {
      setValue("documentInfo.author", author, { shouldValidate: false });
    }
  }, [author, setValue, getValues, isEdit]);

  if (isEdit && editFile.data && editFile.data.sha !== editSeededSha) {
    try {
      const parsed = fromTddMarkdown(editFile.data.content);
      reset(parsed);
      setEditOriginal(parsed);
      setEditSeededSha(editFile.data.sha);
      setEditLoadError(null);
      setStep(0);
    } catch (err) {
      const messages =
        err instanceof TddParseError ? err.messages : [(err as Error).message];
      setEditLoadError(messages);
      setEditSeededSha(editFile.data.sha);
    }
  }

  const safeFilename = (ext: string) => {
    const id = getValues("documentInfo.docId") || "tdd";
    return `${id.replace(/[^a-zA-Z0-9._-]+/g, "_")}.${ext}`;
  };

  const commitPath = () => {
    if (isEdit) return editPath;
    const id = getValues("documentInfo.docId") || "tdd";
    const safeId = id.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const folder = folderInput.trim() || slugifyAuthor(author);
    return `${folder}/${safeId}.md`;
  };

  const onCommit = async (data: TddSchema) => {
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
      const content = toTddMarkdown(data);

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

    const content = toTddMarkdown({
      ...data,
      documentInfo: { ...data.documentInfo, author },
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
      reset(initialTddData);
      navigate(`/view/${path}`);
    } catch (e) {
      setCommitOutcome({ kind: "error", message: messageFor(e) });
    }
  };

  const onExportMd = () => {
    downloadFile(
      safeFilename("md"),
      toTddMarkdown(getValues()),
      "text/markdown",
    );
  };

  const onDownloadSampleMd = () => {
    downloadFile("tdd-sample.md", toTddSampleMarkdown(), "text/markdown");
  };

  const onExportHtml = () => {
    const html = toTddHtml(getValues());
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
      const parsed = fromTddMarkdown(text);
      reset(parsed);
      setData(parsed);
      setStep(0);
      await trigger();
      setShowImportValidation(true);
    } catch (err) {
      const messages =
        err instanceof TddParseError ? err.messages : [(err as Error).message];
      setImportError(messages);
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
      if (editOriginal) reset(editOriginal);
      setStep(0);
      setCommitOutcome(null);
      return;
    }

    resetStore();
    reset(initialTddData);
  };

  const onFillSample = () => {
    reset(sampleTddData);
    setData(sampleTddData);
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
              <>
                <DocumentInfoSection
                  register={register}
                  control={control}
                  errors={errors}
                />
                <ContextGoalsSection
                  register={register}
                  control={control}
                  errors={errors}
                />
              </>
            )}

            {step === 1 && (
              <>
                <DiagramSection
                  register={register}
                  control={control}
                  errors={errors}
                  name="architecture"
                  legend="Kiến trúc tổng quan (Architecture)"
                  description="Sơ đồ các thành phần và cách chúng ghép với nhau"
                />
                <DiagramSection
                  register={register}
                  control={control}
                  errors={errors}
                  name="sequenceDiagram"
                  legend="Sequence Diagram"
                  description="Luồng nhiều bên gọi qua lại theo thời gian"
                />
                <DiagramSection
                  register={register}
                  control={control}
                  errors={errors}
                  name="activityDiagram"
                  legend="Activity Diagram"
                  description="Logic nhiều nhánh điều kiện"
                />
                <DiagramSection
                  register={register}
                  control={control}
                  errors={errors}
                  name="stateDiagram"
                  legend="State Diagram"
                  description="Vòng đời trạng thái của thực thể chính"
                />
                <DiagramSection
                  register={register}
                  control={control}
                  errors={errors}
                  name="dataModel"
                  legend="Mô hình dữ liệu (Data Model / ERD)"
                  description="Bảng và quan hệ liên quan"
                />
              </>
            )}

            {step === 2 && (
              <InternalApiSection
                register={register}
                control={control}
                errors={errors}
              />
            )}

            {step === 3 && (
              <ExternalApiSection
                register={register}
                control={control}
                errors={errors}
              />
            )}

            {step === 4 && (
              <>
                <ReferencesSection control={control} register={register} />
                <ChangeLogSection
                  register={register}
                  control={control}
                  errors={errors}
                />
              </>
            )}
          </div>

          {!isEdit && isLast && (
            <FolderPicker
              authorSlug={slugifyAuthor(author)}
              value={folderInput}
              onChange={setFolderInput}
              fileId={docId || ""}
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

          <TddPreviewPanel control={control} />
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
  const safeFileId = (fileId || "tdd").replace(/[^a-zA-Z0-9._-]+/g, "_");

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
            Đang chỉnh sửa (TDD)
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
            Không thể đọc file theo lược đồ TDD
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
  data: TddSchema,
  author: string,
  isUpdate: boolean,
): string {
  const docId = data.documentInfo.docId;
  const feature = data.documentInfo.feature;
  const titleParts = [docId, feature].filter(Boolean);
  const title =
    titleParts.length > 0 ? titleParts.join(" – ") : "technical design doc";
  const parts: string[] = [title, ""];
  parts.push(`Author: ${author}`);
  const versionStatus = [
    data.documentInfo.version ? `Version: ${data.documentInfo.version}` : "",
    data.documentInfo.status ? `Status: ${data.documentInfo.status}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  if (versionStatus) parts.push(versionStatus);
  const action = isUpdate ? "Update" : "Create";
  parts.push("", `${action}d by ${author} on the web.`);
  return parts.join("\n");
}

function buildEditCommitMessage(
  path: string,
  original: TddSchema | null,
  next: TddSchema,
  websiteUser: string,
): string {
  const header = `Update ${path} via TDD form`;
  const footer = `Edited by ${websiteUser} on the web.`;
  if (!original) return `${header}\n\n${footer}`;
  const changes = summarizeChanges(original, next);
  if (changes.length === 0)
    return `${header}\n\nNo field-level changes detected.\n\n${footer}`;
  return `${header}\n\nChanges:\n${changes.map((c) => `- ${c}`).join("\n")}\n\n${footer}`;
}

function summarizeChanges(prev: TddSchema, next: TddSchema): string[] {
  const eq = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);
  const countChange = (before: unknown[], after: unknown[]) =>
    `${before.length}→${after.length}`;
  const lines: string[] = [];

  const infoFields: (keyof TddSchema["documentInfo"])[] = [
    "docId",
    "feature",
    "author",
    "reviewer",
    "status",
    "version",
    "updatedAt",
  ];
  const infoChanged = infoFields.filter(
    (f) => !eq(prev.documentInfo[f], next.documentInfo[f]),
  );
  if (infoChanged.length) lines.push(`documentInfo: ${infoChanged.join(", ")}`);
  if (!eq(prev.documentInfo.relatedStories, next.documentInfo.relatedStories))
    lines.push(
      `relatedStories (${countChange(prev.documentInfo.relatedStories, next.documentInfo.relatedStories)})`,
    );
  if (!eq(prev.documentInfo.businessRules, next.documentInfo.businessRules))
    lines.push(
      `businessRules meta (${countChange(prev.documentInfo.businessRules, next.documentInfo.businessRules)})`,
    );

  const ctxChanged: string[] = [];
  if (prev.contextGoals.problem !== next.contextGoals.problem)
    ctxChanged.push("problem");
  if (!eq(prev.contextGoals.goals, next.contextGoals.goals))
    ctxChanged.push(
      `goals (${countChange(prev.contextGoals.goals, next.contextGoals.goals)})`,
    );
  if (!eq(prev.contextGoals.nonGoals, next.contextGoals.nonGoals))
    ctxChanged.push(
      `nonGoals (${countChange(prev.contextGoals.nonGoals, next.contextGoals.nonGoals)})`,
    );
  if (ctxChanged.length) lines.push(`contextGoals: ${ctxChanged.join(", ")}`);

  const diagramSections = [
    "architecture",
    "sequenceDiagram",
    "activityDiagram",
    "stateDiagram",
    "dataModel",
  ] as const;
  for (const section of diagramSections) {
    if (!eq(prev[section], next[section])) lines.push(section);
  }

  const internalChanged: string[] = [];
  if (!eq(prev.internalApi.endpoints, next.internalApi.endpoints))
    internalChanged.push(
      `endpoints (${countChange(prev.internalApi.endpoints, next.internalApi.endpoints)})`,
    );
  if (!eq(prev.internalApi.examples, next.internalApi.examples))
    internalChanged.push(
      `examples (${countChange(prev.internalApi.examples, next.internalApi.examples)})`,
    );
  if (!eq(prev.internalApi.errorCodes, next.internalApi.errorCodes))
    internalChanged.push(
      `errorCodes (${countChange(prev.internalApi.errorCodes, next.internalApi.errorCodes)})`,
    );
  if (internalChanged.length)
    lines.push(`internalApi: ${internalChanged.join(", ")}`);

  const externalChanged: string[] = [];
  if (!eq(prev.externalApi.endpoints, next.externalApi.endpoints))
    externalChanged.push(
      `endpoints (${countChange(prev.externalApi.endpoints, next.externalApi.endpoints)})`,
    );
  if (!eq(prev.externalApi.fields, next.externalApi.fields))
    externalChanged.push(
      `fields (${countChange(prev.externalApi.fields, next.externalApi.fields)})`,
    );
  if (prev.externalApi.errorHandling !== next.externalApi.errorHandling)
    externalChanged.push("errorHandling");
  if (!eq(prev.externalApi.quirks, next.externalApi.quirks))
    externalChanged.push(
      `quirks (${countChange(prev.externalApi.quirks, next.externalApi.quirks)})`,
    );
  if (externalChanged.length)
    lines.push(`externalApi: ${externalChanged.join(", ")}`);

  const refChanged: string[] = [];
  if (!eq(prev.references.userStories, next.references.userStories))
    refChanged.push(
      `userStories (${countChange(prev.references.userStories, next.references.userStories)})`,
    );
  if (!eq(prev.references.businessRules, next.references.businessRules))
    refChanged.push(
      `businessRules (${countChange(prev.references.businessRules, next.references.businessRules)})`,
    );
  if (!eq(prev.references.useCases, next.references.useCases))
    refChanged.push(
      `useCases (${countChange(prev.references.useCases, next.references.useCases)})`,
    );
  if (!eq(prev.references.others, next.references.others))
    refChanged.push(
      `others (${countChange(prev.references.others, next.references.others)})`,
    );
  if (refChanged.length) lines.push(`references: ${refChanged.join(", ")}`);

  if (!eq(prev.changeLog, next.changeLog))
    lines.push(`changeLog (${countChange(prev.changeLog, next.changeLog)})`);

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
  control: ReturnType<typeof useForm<TddSchema>>["control"];
}) {
  const values = useWatch({ control });
  const setData = useTddFormStore((s) => s.setData);

  useEffect(() => {
    setData(values as TddSchema);
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
