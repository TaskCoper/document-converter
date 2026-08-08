import { SplitHandle } from "@/components/split-handle";
import { useSplitPane } from "@/hooks/use-split-pane";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  adaptRule,
  adaptTdd,
  adaptUserStoryForm,
  storyLinkHref,
} from "@/features/projects/adapt-document";
import { NumberSelect } from "@/features/projects/components/number-select";
import {
  DocumentGovernanceMetadataEditor,
} from "@/features/projects/components/document-governance-metadata-editor";
import { RelatedDocumentsPanel } from "@/features/projects/components/related-documents-panel";
import { TestDocumentEditor } from "@/features/projects/components/test-document";
import {
  DocumentType,
  STORY_WORK_STATE_OPTIONS,
  StoryWorkState,
  StoryWorkStateLabel,
} from "@/features/projects/document-types";
import { errorDetail } from "@/features/projects/error";
import { useDocument } from "@/features/projects/hooks/use-document";
import { useGovernanceMetadataEditor } from "@/features/projects/hooks/use-governance-metadata-editor";
import { useMyProjectRole } from "@/features/projects/hooks/use-my-role";
import { canEditDocuments } from "@/features/projects/permissions";
import {
  saveRule,
  saveTdd,
  saveUserStory,
} from "@/features/projects/save-document";
import type { DocumentDetail } from "@/features/projects/document-types";
// Tái dùng ĐÚNG các form-section của trang stories.page — chỉ đổi nguồn load/save sang backend.
import { AcceptanceCriteriaSection } from "@/features/user-stories/components/acceptance-criteria-section";
import { ConditionsSection } from "@/features/user-stories/components/conditions-section";
import { FlowSection } from "@/features/user-stories/components/flow-section";
import { MetadataSection } from "@/features/user-stories/components/metadata-section";
import { WafflePreviewPanel } from "@/features/user-stories/components/waffle-preview-panel";
import { ReferencesSection } from "@/features/user-stories/components/references-section";
import { StringListSection } from "@/features/user-stories/components/string-list-section";
import {
  backendSchema,
  type Schema,
} from "@/features/user-stories/validations";
// Tái dùng ĐÚNG các form-section của trang tdd.page — chỉ bỏ 2 bước API nội bộ/bên ngoài và
// Change Log (backend chưa có endpoint replace cho endpoints/errorCodes/changeLog).
import { ContextGoalsSection } from "@/features/tdds/components/context-goals-section";
import { DiagramSection } from "@/features/tdds/components/diagram-section";
import { ExternalApiSection } from "@/features/tdds/components/external-api-section";
import { InternalApiSection } from "@/features/tdds/components/internal-api-section";
import { LinkMetaField } from "@/features/tdds/components/link-meta-field";
import { TddStringArrayField } from "@/features/tdds/components/tdd-string-array-field";
import { DocumentInfoSection } from "@/features/tdds/components/document-info-section";
import { ReferencesSection as TddReferencesSection } from "@/features/tdds/components/references-section";
import { TddLivePreview } from "@/features/tdds/components/tdd-live-preview";
import { tddSchema, type TddSchema } from "@/features/tdds/validations";
// Tái dùng ĐÚNG các form-section của trang rule.page.
import {
  RuleGovernanceSection,
  RuleIdentitySection,
  RuleLogicSection,
} from "@/features/business-rules/components/rule-form-sections";
import { RuleLivePreview } from "@/features/business-rules/components/rule-live-preview";
import {
  ruleSchema,
  type RuleSchema,
} from "@/features/business-rules/validations";
import { projectKeys } from "@/lib/query-keys";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FieldPath } from "react-hook-form";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";

export default function ProjectDocumentEditPage() {
  const { projectId = "", documentId = "" } = useParams();
  const { document, isLoading, isError } = useDocument(documentId);
  const myRole = useMyProjectRole(projectId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Không tìm thấy tài liệu, hoặc bạn không có quyền truy cập.
        </p>
      </div>
    );
  }

  const backTo = `/projects/${projectId}/documents/${documentId}`;

  if (!myRole || !canEditDocuments(myRole)) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Bạn cần quyền Biên tập trở lên để sửa tài liệu.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          nativeButton={false}
          render={<Link to={backTo} />}
        >
          Quay lại
        </Button>
      </div>
    );
  }

  if (document.docType === DocumentType.Tdd) {
    return (
      <TddEditor projectId={projectId} documentId={documentId} doc={document} />
    );
  }

  if (document.docType === DocumentType.BusinessRule) {
    return (
      <RuleEditor
        projectId={projectId}
        documentId={documentId}
        doc={document}
      />
    );
  }

  if (
    document.docType === DocumentType.UnitTest ||
    document.docType === DocumentType.SystemTest
  ) {
    return <TestDocumentEditor projectId={projectId} doc={document} />;
  }

  return (
    <UserStoryEditor
      projectId={projectId}
      documentId={documentId}
      doc={document}
    />
  );
}

// Khối "Thông tin tài liệu" (title/notes) dùng chung cho TDD & Rule — các
// field này thuộc metadata mức tài liệu (updateMetadata), không nằm trong TddSchema/RuleSchema.
function DocMetaFields({
  title,
  onTitle,
  notes,
  onNotes,
}: {
  title: string;
  onTitle: (v: string) => void;
  notes: string;
  onNotes: (v: string) => void;
}) {
  return (
    <FieldSet>
      <FieldLegend>Thông tin tài liệu</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="doc-title">Tiêu đề</FieldLabel>
          <Input
            id="doc-title"
            value={title}
            onChange={(e) => onTitle(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="doc-notes">Ghi chú</FieldLabel>
          <Textarea
            id="doc-notes"
            value={notes}
            onChange={(e) => onNotes(e.target.value)}
            rows={2}
          />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}

function EditorStepper({
  steps,
  current,
  onSelect,
}: {
  steps: { title: string }[];
  current: number;
  onSelect: (i: number) => void;
}) {
  const didMount = useRef(false);
  const stepButtons = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    stepButtons.current[current]?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [current]);

  return (
    <div className="min-w-0 overflow-x-auto pb-1">
      <ol
        aria-label="Các bước chỉnh sửa"
        className="flex min-w-max items-stretch gap-2 sm:min-w-0"
      >
        {steps.map((s, i) => {
          const isActive = i === current;
          const isDone = i < current;
          return (
            <li
              key={s.title}
              className="w-36 shrink-0 sm:w-auto sm:min-w-36 sm:flex-1"
            >
              <button
                ref={(element) => {
                  stepButtons.current[i] = element;
                }}
                type="button"
                aria-current={isActive ? "step" : undefined}
                onClick={() => onSelect(i)}
                className={
                  "flex w-full cursor-pointer flex-col items-start gap-1 border-t-2 pt-2 text-left transition-colors " +
                  (isActive
                    ? "border-primary"
                    : isDone
                      ? "border-primary/60"
                      : "border-border hover:border-foreground/30")
                }
              >
                <span
                  className={
                    "text-[10px] uppercase tracking-wide " +
                    (isActive
                      ? "text-primary"
                      : isDone
                        ? "text-primary/70"
                        : "text-muted-foreground")
                  }
                >
                  Bước {i + 1}
                </span>
                <span
                  className={
                    "text-xs font-medium " +
                    (!isActive && !isDone ? "text-muted-foreground" : "")
                  }
                >
                  {s.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── TDD ──────────────────────────────────────────────────────────────────────────────
// Chỉ 3/5 bước của tdd.page.tsx: bỏ "API nội bộ" và "API bên ngoài" (xem ghi chú trong
// save-document.ts#saveTdd — backend chưa có endpoint lưu endpoints/errorCodes/changeLog).
const TDD_STEPS: {
  title: string;
  description: string;
  fields: FieldPath<TddSchema>[];
}[] = [
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
    title: "API",
    description: "Endpoint nội bộ/đối tác, ví dụ request-response và mã lỗi",
    fields: ["internalApi", "externalApi"],
  },
  {
    title: "Tham chiếu",
    description: "User Story, Business Rule, Use Case liên quan",
    fields: ["references"],
  },
];

function TddEditor({
  projectId,
  documentId,
  doc,
}: {
  projectId: string;
  documentId: string;
  doc: DocumentDetail;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const governanceMetadata = useGovernanceMetadataEditor(
    documentId,
    projectId,
  );

  // Bề ngang khung xem trước kéo được, và nhớ lại cho lần sau.
  const { setContainer, style: paneStyle, handleProps } = useSplitPane({
    storageKey: "tdd-preview-width",
    initial: 512,
  });
  const backTo = `/projects/${projectId}/documents/${documentId}`;

  const {
    register,
    control,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<TddSchema>({
    resolver: standardSchemaResolver(tddSchema),
    defaultValues: adaptTdd(doc),
  });

  const [title, setTitle] = useState(doc.content.title);
  const [notes, setNotes] = useState(doc.content.notesMd ?? "");
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isFirst = step === 0;
  const isLast = step === TDD_STEPS.length - 1;
  const current = TDD_STEPS[step];

  const goNext = async () => {
    const ok = await trigger(current.fields);
    if (ok) setStep((s) => s + 1);
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const onSave = async () => {
    if (!title.trim()) {
      setSaveError("Vui lòng nhập tiêu đề tài liệu.");
      return;
    }
    const valid = await trigger();
    if (!valid) {
      setSaveError("Còn trường chưa hợp lệ — kiểm tra lại các bước.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await saveTdd(doc, getValues(), {
        title: title.trim(),
        storyWorkState: null,
        notesMd: notes.trim() || null,
      });
      await governanceMetadata.save();
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      navigate(backTo);
    } catch (err) {
      setSaveError(errorDetail(err, "Lưu tài liệu thất bại."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={setContainer}
      style={paneStyle}
      className="mx-auto grid max-w-[110rem] grid-cols-1 gap-x-2 gap-y-8 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_auto_var(--pane-w)]"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeftIcon className="size-3.5" />
          {doc.docKey} · {doc.content.title}
        </Link>

        <h2 className="text-lg font-semibold text-primary">
          Sửa nội dung (TDD)
        </h2>

        <RelatedDocumentsPanel
          projectId={projectId}
          documentId={documentId}
          currentDocKey={doc.docKey}
          currentTitle={title}
          currentDocType={doc.docType}
          outgoingLinks={doc.resolvedLinks}
        />

        <DocMetaFields
          title={title}
          onTitle={setTitle}
          notes={notes}
          onNotes={setNotes}
        />

        <DocumentGovernanceMetadataEditor editor={governanceMetadata} />

        <EditorStepper steps={TDD_STEPS} current={step} onSelect={setStep} />

        <div className="-space-y-0.5">
          <h3 className="text-sm font-semibold text-primary">
            Bước {step + 1}. {current.title}
          </h3>
          <p className="text-xs text-muted-foreground">{current.description}</p>
        </div>

        <form className="flex flex-col gap-8">
          <div className="flex flex-col gap-8">
            {step === 0 && (
              <>
                <DocumentInfoSection
                  register={register}
                  control={control}
                  errors={errors}
                  backend
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
                  backend
                  name="architecture"
                  legend="Kiến trúc tổng quan (Architecture)"
                  description="Sơ đồ các thành phần và cách chúng ghép với nhau"
                />
                <DiagramSection
                  register={register}
                  control={control}
                  errors={errors}
                  backend
                  name="sequenceDiagram"
                  legend="Sequence Diagram"
                  description="Luồng nhiều bên gọi qua lại theo thời gian"
                />
                <DiagramSection
                  register={register}
                  control={control}
                  errors={errors}
                  backend
                  name="activityDiagram"
                  legend="Activity Diagram"
                  description="Logic nhiều nhánh điều kiện"
                />
                <DiagramSection
                  register={register}
                  control={control}
                  errors={errors}
                  backend
                  name="stateDiagram"
                  legend="State Diagram"
                  description="Vòng đời trạng thái của thực thể chính"
                />
                <DiagramSection
                  register={register}
                  control={control}
                  errors={errors}
                  backend
                  name="dataModel"
                  legend="Mô hình dữ liệu (Data Model / ERD)"
                  description="Bảng và quan hệ liên quan"
                />
              </>
            )}

            {step === 2 && (
              <>
                <InternalApiSection
                  register={register}
                  control={control}
                  errors={errors}
                  backend
                />
                <ExternalApiSection
                  register={register}
                  control={control}
                  errors={errors}
                  backend
                />
              </>
            )}

            {step === 3 && (
              <>
                <TddReferencesSection register={register} control={control} />
                {/* Loại cạnh + ghi chú: chỉ có ở DB, Markdown của TDD không chứa chúng. */}
                <LinkMetaField control={control} register={register} />
                {/* Hai mục dưới chỉ có ở DB (document_list_items 90/91). */}
                <TddStringArrayField
                  control={control}
                  register={register}
                  name="assumptions"
                  label="Giả định"
                  placeholder="Điều đang mặc định là đúng"
                />
                <TddStringArrayField
                  control={control}
                  register={register}
                  name="openQuestions"
                  label="Câu hỏi mở"
                  placeholder="Điểm còn phải chốt"
                />
              </>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-border pt-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to={backTo} />}
            >
              Huỷ
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={isFirst}
            >
              <ChevronLeftIcon />
              Quay lại
            </Button>
            {isLast ? (
              <Button type="button" onClick={onSave} disabled={saving}>
                {saving ? <Spinner /> : <CheckIcon />}
                Lưu
              </Button>
            ) : (
              <Button type="button" onClick={goNext}>
                Tiếp theo
                <ChevronRightIcon />
              </Button>
            )}
          </div>

          {saveError && <p className="text-xs text-destructive">{saveError}</p>}
        </form>
      </div>

      <SplitHandle {...handleProps} />

      <div className="hidden xl:flex xl:flex-col xl:gap-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-6rem)] xl:self-start xl:overflow-y-auto">
        <div className="bg-background">
          <TddLivePreview control={control} notes={notes} />
        </div>
      </div>
    </div>
  );
}

// ── Business Rule ────────────────────────────────────────────────────────────────────
const RULE_STEPS: {
  title: string;
  description: string;
  fields: FieldPath<RuleSchema>[];
}[] = [
  {
    title: "Định danh & Phân loại",
    description: "Rule ID, tên, danh mục, trạng thái, phiên bản",
    fields: [
      "ruleId",
      "name",
      "category",
      "status",
      "version",
      "effectiveDate",
    ],
  },
  {
    title: "Nội dung rule",
    description: "Phát biểu, điều kiện, hành vi, ngoại lệ",
    fields: ["statement", "when", "then", "except"],
  },
  {
    title: "Quản trị & Tham chiếu",
    description: "Nguồn, người sở hữu, story liên quan, ghi chú",
    fields: ["source", "owner", "relatedStories", "notes"],
  },
];

function RuleEditor({
  projectId,
  documentId,
  doc,
}: {
  projectId: string;
  documentId: string;
  doc: DocumentDetail;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const governanceMetadata = useGovernanceMetadataEditor(
    documentId,
    projectId,
  );

  // Bề ngang khung xem trước kéo được, và nhớ lại cho lần sau.
  const { setContainer, style: paneStyle, handleProps } = useSplitPane({
    storageKey: "rule-preview-width",
    initial: 512,
  });
  const backTo = `/projects/${projectId}/documents/${documentId}`;

  const {
    register,
    control,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<RuleSchema>({
    resolver: standardSchemaResolver(ruleSchema),
    defaultValues: adaptRule(doc),
  });

  const [title, setTitle] = useState(doc.content.title);
  const [notes, setNotes] = useState(doc.content.notesMd ?? "");
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isFirst = step === 0;
  const isLast = step === RULE_STEPS.length - 1;
  const current = RULE_STEPS[step];

  const goNext = async () => {
    const ok = await trigger(current.fields);
    if (ok) setStep((s) => s + 1);
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const onSave = async () => {
    if (!title.trim()) {
      setSaveError("Vui lòng nhập tiêu đề tài liệu.");
      return;
    }
    const valid = await trigger();
    if (!valid) {
      setSaveError("Còn trường chưa hợp lệ — kiểm tra lại các bước.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await saveRule(doc, getValues(), {
        title: title.trim(),
        storyWorkState: null,
        notesMd: notes.trim() || null,
      });
      await governanceMetadata.save();
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      navigate(backTo);
    } catch (err) {
      setSaveError(errorDetail(err, "Lưu tài liệu thất bại."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={setContainer}
      style={paneStyle}
      className="mx-auto grid max-w-[110rem] grid-cols-1 gap-x-2 gap-y-8 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_auto_var(--pane-w)]"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeftIcon className="size-3.5" />
          {doc.docKey} · {doc.content.title}
        </Link>

        <h2 className="text-lg font-semibold text-primary">
          Sửa nội dung (Business Rule)
        </h2>

        <RelatedDocumentsPanel
          projectId={projectId}
          documentId={documentId}
          currentDocKey={doc.docKey}
          currentTitle={title}
          currentDocType={doc.docType}
          outgoingLinks={doc.resolvedLinks}
        />

        <DocMetaFields
          title={title}
          onTitle={setTitle}
          notes={notes}
          onNotes={setNotes}
        />

        <DocumentGovernanceMetadataEditor editor={governanceMetadata} />

        <EditorStepper steps={RULE_STEPS} current={step} onSelect={setStep} />

        <div className="-space-y-0.5">
          <h3 className="text-sm font-semibold text-primary">
            Bước {step + 1}. {current.title}
          </h3>
          <p className="text-xs text-muted-foreground">{current.description}</p>
        </div>

        <form className="flex flex-col gap-8">
          <div className="flex flex-col gap-8">
            {step === 0 && (
              <RuleIdentitySection
                register={register}
                control={control}
                errors={errors}
                backend
              />
            )}
            {step === 1 && (
              <RuleLogicSection
                register={register}
                control={control}
                errors={errors}
              />
            )}
            {step === 2 && (
              <RuleGovernanceSection
                register={register}
                control={control}
                errors={errors}
              />
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-border pt-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to={backTo} />}
            >
              Huỷ
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={isFirst}
            >
              <ChevronLeftIcon />
              Quay lại
            </Button>
            {isLast ? (
              <Button type="button" onClick={onSave} disabled={saving}>
                {saving ? <Spinner /> : <CheckIcon />}
                Lưu
              </Button>
            ) : (
              <Button type="button" onClick={goNext}>
                Tiếp theo
                <ChevronRightIcon />
              </Button>
            )}
          </div>

          {saveError && <p className="text-xs text-destructive">{saveError}</p>}
        </form>
      </div>

      <SplitHandle {...handleProps} />

      <div className="hidden xl:flex xl:flex-col xl:gap-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-6rem)] xl:self-start xl:overflow-y-auto">
        <div className="bg-background">
          <RuleLivePreview control={control} notes={notes} />
        </div>
      </div>
    </div>
  );
}

// ── User Story ──────────────────────────────────────────────────────────────────────
const USER_STORY_STEPS: {
  title: string;
  description: string;
  fields: FieldPath<Schema>[];
}[] = [
  {
    title: "Thông tin Story",
    description: "Nội dung, sprint, độ ưu tiên và người phụ trách",
    fields: ["metadata"],
  },
  {
    title: "Điều kiện & Luồng",
    description: "Điều kiện tiên quyết, kích hoạt và các luồng xử lý",
    fields: ["conditions", "flow"],
  },
  {
    title: "Tiêu chí chấp nhận",
    description: "Các kịch bản Given, When, Then và And",
    fields: ["acceptanceCriteria"],
  },
  {
    title: "Tham chiếu & Phạm vi",
    description:
      "Tài liệu liên quan, yêu cầu phi chức năng, phạm vi và các điểm cần chốt",
    fields: [
      "references",
      "nonFunctional",
      "outOfScope",
      "assumptions",
      "openQuestions",
    ],
  },
];

function UserStoryEditor({
  projectId,
  documentId,
  doc,
}: {
  projectId: string;
  documentId: string;
  doc: DocumentDetail;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const governanceMetadata = useGovernanceMetadataEditor(
    documentId,
    projectId,
  );

  // Bề ngang khung xem trước kéo được, và nhớ lại cho lần sau.
  const { setContainer, style: paneStyle, handleProps } = useSplitPane({
    storageKey: "story-preview-width",
    initial: 704,
  });
  const backTo = `/projects/${projectId}/documents/${documentId}`;

  const {
    register,
    control,
    formState: { errors },
    trigger,
    getValues,
    setValue,
  } = useForm<Schema>({
    resolver: standardSchemaResolver(backendSchema),
    defaultValues: adaptUserStoryForm(doc),
  });

  // Mã tài liệu trong REFERENCES → đường dẫn mở được, dùng chung bộ nối của trang chi tiết.
  const previewLinkHref = useMemo(() => storyLinkHref(doc), [doc]);

  // Metadata mức tài liệu — gộp "Sửa thông tin" vào ngay đây.
  const [title, setTitle] = useState(doc.content.title);
  const [status, setStatus] = useState<StoryWorkState>(
    doc.storyWorkState ?? StoryWorkState.Todo,
  );
  const [notes, setNotes] = useState(doc.content.notesMd ?? "");

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isFirst = step === 0;
  const isLast = step === USER_STORY_STEPS.length - 1;
  const current = USER_STORY_STEPS[step];

  const goNext = async () => {
    const ok = await trigger(current.fields);
    if (ok) setStep((value) => value + 1);
  };
  const goBack = () => setStep((value) => Math.max(0, value - 1));

  const onSave = async () => {
    if (!title.trim()) {
      setSaveError("Vui lòng nhập tiêu đề tài liệu.");
      return;
    }
    const valid = await trigger();
    if (!valid) {
      setSaveError("Còn trường chưa hợp lệ — kiểm tra lại các bước.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await saveUserStory(doc, getValues(), {
        title: title.trim(),
        storyWorkState: status,
        notesMd: notes.trim() || null,
      });
      await governanceMetadata.save();
      // Refresh chi tiết + preview + danh sách.
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      navigate(backTo);
    } catch (err) {
      setSaveError(errorDetail(err, "Lưu tài liệu thất bại."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={setContainer}
      style={paneStyle}
      className="mx-auto grid max-w-[110rem] grid-cols-1 gap-x-2 gap-y-8 px-4 py-4 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_auto_var(--pane-w)] xl:grid-rows-[minmax(0,1fr)]"
    >
      <div className="relative flex min-w-0 flex-col gap-6 xl:min-h-0 xl:overflow-y-auto xl:[&>*]:shrink-0">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <ArrowLeftIcon className="size-3.5" />
            {doc.docKey} · {doc.content.title}
          </Link>
        </div>

        <h2 className="text-lg font-semibold text-primary">Sửa nội dung</h2>

        <RelatedDocumentsPanel
          projectId={projectId}
          documentId={documentId}
          currentDocKey={doc.docKey}
          currentTitle={title}
          currentDocType={doc.docType}
          outgoingLinks={doc.resolvedLinks}
        />

        {/* Thông tin tài liệu (gộp từ "Sửa thông tin") */}
        <FieldSet>
          <FieldLegend>Thông tin tài liệu</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="doc-title">Tiêu đề</FieldLabel>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <div className="grid gap-4">
              <Field>
                <FieldLabel htmlFor="doc-status">
                  Tiến độ User Story
                </FieldLabel>
                <NumberSelect
                  id="doc-status"
                  value={status}
                  onChange={(value) =>
                    setStatus(value as StoryWorkState)
                  }
                  options={STORY_WORK_STATE_OPTIONS.map((v) => ({
                    value: v,
                    label: StoryWorkStateLabel[v],
                  }))}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="doc-notes">Ghi chú</FieldLabel>
              <Textarea
                id="doc-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        <DocumentGovernanceMetadataEditor editor={governanceMetadata} />

        <EditorStepper
          steps={USER_STORY_STEPS}
          current={step}
          onSelect={setStep}
        />

        <div className="-space-y-0.5">
          <h3 className="text-sm font-semibold text-primary">
            Bước {step + 1}. {current.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {current.description}
          </p>
        </div>

        <form className="flex flex-col gap-8">
          <div className="flex flex-col gap-8">
            {/* backend: nguồn là DB chứ không phải Markdown, nên các section hiện thêm ô
                nhập cho những field chỉ DB mới giữ được (tiêu đề luồng, loại liên kết, ghi
                chú liên kết) và ẩn ô trạng thái trùng với khối phía trên. */}
            {step === 0 && (
              <MetadataSection
                register={register}
                control={control}
                errors={errors}
                setValue={setValue}
                projectId={projectId}
                backend
              />
            )}

            {step === 1 && (
              <>
                <ConditionsSection
                  register={register}
                  control={control}
                  errors={errors}
                  backend
                />
                <FlowSection
                  register={register}
                  control={control}
                  errors={errors}
                  backend
                />
              </>
            )}

            {step === 2 && (
              <AcceptanceCriteriaSection
                register={register}
                control={control}
                errors={errors}
                backend
              />
            )}

            {step === 3 && (
              <>
                {/* KHÔNG có trình sửa sơ đồ ở đây: sơ đồ thuộc về TDD. Bảng
                    document_diagrams dùng chung cho mọi loại tài liệu và dữ liệu mẫu có
                    gắn sơ đồ vào cả User Story, nên adaptUserStoryForm vẫn nạp `diagrams`
                    và saveUserStory vẫn gửi lại y nguyên — bỏ hẳn khỏi form thì lần lưu kế
                    tiếp sẽ xoá sạch chúng. */}
                <ReferencesSection
                  control={control}
                  register={register}
                  projectId={projectId}
                  backend
                />
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
                {/* Hai mục dưới chỉ có ở DB (document_list_items 90/91) — Markdown của US
                    không có chỗ chứa, nên trang sửa cũ không hề đụng tới chúng. */}
                <StringListSection
                  legend="Giả định"
                  description="Những điều đang mặc định là đúng khi viết story này"
                  name="assumptions"
                  control={control}
                  register={register}
                />
                <StringListSection
                  legend="Câu hỏi mở"
                  description="Những điểm còn phải chốt lại"
                  name="openQuestions"
                  control={control}
                  register={register}
                />
              </>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-border pt-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to={backTo} />}
            >
              Huỷ
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={isFirst}
            >
              <ChevronLeftIcon />
              Quay lại
            </Button>
            {isLast ? (
              <Button type="button" onClick={onSave} disabled={saving}>
                {saving ? <Spinner /> : <CheckIcon />}
                Lưu
              </Button>
            ) : (
              <Button type="button" onClick={goNext}>
                Tiếp theo
                <ChevronRightIcon />
              </Button>
            )}
          </div>

          {saveError && <p className="text-xs text-destructive">{saveError}</p>}
        </form>
      </div>

      <SplitHandle {...handleProps} />

      <div className="hidden xl:min-h-0 xl:overflow-y-auto xl:flex xl:flex-col xl:gap-4">
        <div className="min-h-0 flex-1 bg-background">
          {/* Dùng CHÍNH bảng waffle của trang chi tiết, không phải một bộ render riêng — thứ
              nhìn thấy lúc sửa phải là thứ sẽ thấy sau khi lưu. Trạng thái lấy từ ô chọn bên
              trái, không phải từ form US. */}
          <WafflePreviewPanel
            control={control}
            statusLabel={StoryWorkStateLabel[status]}
            linkHref={previewLinkHref}
          />
        </div>
      </div>
    </div>
  );
}
