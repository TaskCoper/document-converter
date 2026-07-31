import { Badge } from "@/components/ui/badge";
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
import { errorDetail } from "@/features/projects/error";
import { projectKeys } from "@/lib/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  CheckIcon,
  ExternalLinkIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import documentService from "../document-services";
import {
  DocumentLinkType,
  DocumentType,
  ReferenceKind,
  SYSTEM_TEST_TYPE_OPTIONS,
  TEST_PRIORITY_OPTIONS,
  TEST_SUITE_OPTIONS,
  TestPriority,
  TestPriorityLabel,
  TestSuite,
  TestSuiteLabel,
  UNIT_TEST_TYPE_OPTIONS,
  UnitTestType,
  UnitTestTypeLabel,
  systemTestTypeLabel,
  type DocumentDetail,
} from "../document-types";
import { NumberSelect } from "./number-select";
import {
  DocumentGovernanceMetadataEditor,
} from "./document-governance-metadata-editor";
import { useGovernanceMetadataEditor } from "../hooks/use-governance-metadata-editor";

const SYSTEM_TEST_STEP = 20;

const REFERENCE_OPTIONS = [
  { value: ReferenceKind.UserStory, label: "User Story" },
  { value: ReferenceKind.Tdd, label: "TDD" },
  { value: ReferenceKind.BusinessRule, label: "Business Rule" },
];

interface TraceLink {
  targetKind: number;
  targetDocKey: string;
  targetSection: string;
  note: string;
}

export function TestDocumentEditor({
  projectId,
  doc,
}: {
  projectId: string;
  doc: DocumentDetail;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const c = doc.content;
  const isUnit = doc.docType === DocumentType.UnitTest;
  const backTo = `/projects/${projectId}/documents/${doc.id}`;
  const governanceMetadata = useGovernanceMetadataEditor(doc.id, projectId);

  const [title, setTitle] = useState(c.title);
  const [notes, setNotes] = useState(c.notesMd ?? "");
  const [testSuite, setTestSuite] = useState(
    c.testSuite ?? TestSuite.Regression,
  );
  const [testPriority, setTestPriority] = useState(
    c.testPriority ?? TestPriority.P1,
  );
  const [rationale, setRationale] = useState(c.rationale ?? "");
  const [ownerName, setOwnerName] = useState(
    c.testOwnerName ?? c.ownerName ?? "",
  );

  const [module, setModule] = useState(c.module ?? "");
  const [unitUnderTest, setUnitUnderTest] = useState(c.unitUnderTest ?? "");
  const [unitTestType, setUnitTestType] = useState(
    c.unitTestType ?? UnitTestType.Happy,
  );
  const [mockSetup, setMockSetup] = useState(c.mockSetup ?? "");
  const [input, setInput] = useState(c.input ?? "");
  const [expectedOutput, setExpectedOutput] = useState(c.expectedOutput ?? "");

  const [storyKey, setStoryKey] = useState(c.storyKey ?? "");
  const [systemTestType, setSystemTestType] = useState(c.systemTestType ?? 1);
  const [precondition, setPrecondition] = useState(c.testPrecondition ?? "");
  const [steps, setSteps] = useState(
    c.listItems
      .filter((item) => item.itemType === SYSTEM_TEST_STEP)
      .map((item) => item.content)
      .join("\n"),
  );
  const [testData, setTestData] = useState(c.testData ?? "");
  const [expectedResult, setExpectedResult] = useState(c.expectedResult ?? "");

  const [traceLinks, setTraceLinks] = useState<TraceLink[]>(
    c.links.map((link) => ({
      targetKind: link.targetKind,
      targetDocKey: link.targetDocKey,
      targetSection: link.targetSection ?? "",
      note: link.note ?? "",
    })),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const previewDocument: DocumentDetail = {
    ...doc,
    content: {
      ...c,
      title,
      notesMd: notes.trim() || null,
      testSuite,
      testPriority,
      rationale,
      testOwnerName: ownerName,
      module,
      unitUnderTest,
      unitTestType,
      mockSetup,
      input,
      expectedOutput,
      storyKey,
      systemTestType,
      testPrecondition: precondition,
      testData,
      expectedResult,
      listItems: isUnit
        ? c.listItems
        : ([
            ...c.listItems.filter(
              (item) => item.itemType !== SYSTEM_TEST_STEP,
            ),
            ...steps
              .split("\n")
              .map((step) => step.trim())
              .filter(Boolean)
              .map((content, index) => ({
                id: `preview-step-${index}`,
                itemType: SYSTEM_TEST_STEP,
                sortOrder: index,
                label: null,
                content,
              })),
          ] as typeof c.listItems),
      links: traceLinks
        .filter((link) => link.targetDocKey.trim())
        .map((link, index) => ({
          id: `preview-link-${index}`,
          targetKind: link.targetKind,
          targetDocKey: link.targetDocKey,
          targetSection: link.targetSection.trim() || null,
          linkType: DocumentLinkType.Verifies,
          note: link.note.trim() || null,
        })) as typeof c.links,
    },
  };

  const updateTrace = (index: number, patch: Partial<TraceLink>) => {
    setTraceLinks((current) =>
      current.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  };

  const toggleSystemType = (value: number) => {
    setSystemTestType((current) => {
      const next = (current & value) !== 0 ? current & ~value : current | value;
      return next || current;
    });
  };

  const save = async () => {
    const required = isUnit
      ? [
          ["Tiêu đề", title],
          ["Module", module],
          ["Unit under test", unitUnderTest],
          ["Expected output", expectedOutput],
          ["Rationale", rationale],
        ]
      : [
          ["Tiêu đề", title],
          ["Story", storyKey],
          ["Steps", steps],
          ["Expected result", expectedResult],
          ["Rationale", rationale],
        ];
    const missingFields = required
      .filter(([, value]) => !value.trim())
      .map(([label]) => label);
    if (missingFields.length > 0) {
      setSaveError(`Vui lòng điền đủ: ${missingFields.join(", ")}.`);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await documentService.updateMetadata(doc.id, {
        title: title.trim(),
        storyWorkState: null,
        ownerId: doc.ownerId,
        sprint: c.sprint,
        priority: c.priority,
        category: c.category,
        effectiveDate: c.effectiveDate,
        notesMd: notes.trim() || null,
      });

      await documentService.updateDetail(
        doc.id,
        isUnit
          ? {
              module: module.trim(),
              unitUnderTest: unitUnderTest.trim(),
              unitTestType,
              mockSetup: mockSetup.trim() || null,
              input: input.trim() || null,
              expectedOutput: expectedOutput.trim(),
              testSuite,
              testPriority,
              rationale: rationale.trim(),
              testOwnerName: ownerName.trim() || null,
            }
          : {
              storyKey: storyKey.trim(),
              systemTestType,
              precondition: precondition.trim() || null,
              testData: testData.trim() || null,
              expectedResult: expectedResult.trim(),
              testSuite,
              testPriority,
              rationale: rationale.trim(),
              testOwnerName: ownerName.trim() || null,
            },
      );

      if (!isUnit) {
        await documentService.replaceListItems(
          doc.id,
          SYSTEM_TEST_STEP,
          steps
            .split("\n")
            .map((step) => step.trim())
            .filter(Boolean)
            .map((content) => ({ label: null, content })),
        );
      }

      await documentService.replaceLinks(
        doc.id,
        traceLinks
          .filter((link) => link.targetDocKey.trim())
          .map((link) => ({
            targetKind: link.targetKind,
            targetDocKey: link.targetDocKey.trim(),
            targetSection: link.targetSection.trim() || null,
            linkType: DocumentLinkType.Verifies,
            note: link.note.trim() || null,
          })),
      );

      await governanceMetadata.save();
      await queryClient.invalidateQueries({ queryKey: projectKeys.all });
      navigate(backTo);
    } catch (error) {
      setSaveError(errorDetail(error, "Lưu test case thất bại."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-4 lg:h-full lg:grid-cols-[1fr_32rem] lg:overflow-hidden">
      <div className="flex min-w-0 flex-col gap-6 lg:min-h-0 lg:overflow-hidden">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeftIcon className="size-3.5" />
          {doc.docKey} · {c.title}
        </Link>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {isUnit ? "Unit test case" : "System test case"}
          </p>
          <h1 className="mt-1 text-xl font-semibold">Sửa {doc.docKey}</h1>
        </div>

        <div className="flex flex-col gap-6 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
          <FieldSet>
        <FieldLegend>Thông tin tài liệu</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="test-title">Tiêu đề *</FieldLabel>
            <Input
              id="test-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="test-notes">Ghi chú</FieldLabel>
            <Textarea
              id="test-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <DocumentGovernanceMetadataEditor editor={governanceMetadata} />

      <FieldSet>
        <FieldLegend>{isUnit ? "Đơn vị kiểm thử" : "Kịch bản hệ thống"}</FieldLegend>
        <FieldGroup>
          {isUnit ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="test-module"
                  label="Module *"
                  value={module}
                  onChange={setModule}
                  placeholder="PRICING"
                />
                <TextField
                  id="unit-under-test"
                  label="Unit under test *"
                  value={unitUnderTest}
                  onChange={setUnitUnderTest}
                  placeholder="C-01 ComboPricingEngine"
                />
              </div>
              <SelectField
                id="unit-test-type"
                label="Loại"
                value={unitTestType}
                onChange={(value) => setUnitTestType(value as UnitTestType)}
                options={UNIT_TEST_TYPE_OPTIONS.map((value) => ({
                  value,
                  label: UnitTestTypeLabel[value],
                }))}
              />
              <LongField
                id="mock-setup"
                label="Precondition / Mock setup"
                value={mockSetup}
                onChange={setMockSetup}
              />
              <LongField
                id="test-input"
                label="Input"
                value={input}
                onChange={setInput}
              />
              <LongField
                id="expected-output"
                label="Expected output *"
                value={expectedOutput}
                onChange={setExpectedOutput}
              />
            </>
          ) : (
            <>
              <TextField
                id="story-key"
                label="Story *"
                value={storyKey}
                onChange={setStoryKey}
                placeholder="STORY-011"
              />
              <Field>
                <FieldLabel>Loại *</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {SYSTEM_TEST_TYPE_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={
                        (systemTestType & option.value) !== 0
                          ? "default"
                          : "outline"
                      }
                      onClick={() => toggleSystemType(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </Field>
              <LongField
                id="system-precondition"
                label="Precondition"
                value={precondition}
                onChange={setPrecondition}
              />
              <LongField
                id="system-steps"
                label="Steps *"
                value={steps}
                onChange={setSteps}
                placeholder={"Chọn PKG_STD\nNhập CODE_OK và áp dụng\nĐặt gói"}
                rows={5}
              />
              <LongField
                id="test-data"
                label="Test data"
                value={testData}
                onChange={setTestData}
              />
              <LongField
                id="expected-result"
                label="Expected result *"
                value={expectedResult}
                onChange={setExpectedResult}
              />
            </>
          )}
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Phân loại và trách nhiệm</FieldLegend>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              id="test-suite"
              label="Suite"
              value={testSuite}
              onChange={(value) => setTestSuite(value as TestSuite)}
              options={TEST_SUITE_OPTIONS.map((value) => ({
                value,
                label: TestSuiteLabel[value],
              }))}
            />
            <SelectField
              id="test-priority"
              label="Priority"
              value={testPriority}
              onChange={(value) => setTestPriority(value as TestPriority)}
              options={TEST_PRIORITY_OPTIONS.map((value) => ({
                value,
                label: TestPriorityLabel[value],
              }))}
            />
            <TextField
              id="test-owner"
              label="Owner"
              value={ownerName}
              onChange={setOwnerName}
            />
          </div>
          <LongField
            id="test-rationale"
            label="Rationale *"
            value={rationale}
            onChange={setRationale}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <div className="flex items-center justify-between gap-3">
          <div>
            <FieldLegend>TEST_LINKS</FieldLegend>
            <p className="text-xs text-muted-foreground">
              Mỗi dòng liên kết một requirement hoặc Business Rule với section cụ thể.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setTraceLinks((links) => [
                ...links,
                {
                  targetKind: isUnit
                    ? ReferenceKind.Tdd
                    : ReferenceKind.UserStory,
                  targetDocKey: "",
                  targetSection: "",
                  note: "",
                },
              ])
            }
          >
            <PlusIcon />
            Thêm link
          </Button>
        </div>
        <FieldGroup>
          {traceLinks.length === 0 ? (
            <p className="border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Chưa có trace link.
            </p>
          ) : (
            traceLinks.map((link, index) => (
              <div
                key={index}
                className="grid gap-2 border border-border/60 bg-muted/20 p-3 sm:grid-cols-[9rem_1fr_10rem_1fr_auto]"
              >
                <NumberSelect
                  value={link.targetKind}
                  onChange={(value) =>
                    updateTrace(index, { targetKind: value })
                  }
                  options={REFERENCE_OPTIONS}
                />
                <Input
                  aria-label={`Tài liệu đích ${index + 1}`}
                  value={link.targetDocKey}
                  onChange={(event) =>
                    updateTrace(index, {
                      targetDocKey: event.target.value.toUpperCase(),
                    })
                  }
                  placeholder="STORY-011"
                />
                <Input
                  aria-label={`Section đích ${index + 1}`}
                  value={link.targetSection}
                  onChange={(event) =>
                    updateTrace(index, { targetSection: event.target.value })
                  }
                  placeholder="AC-04"
                />
                <Input
                  aria-label={`Ghi chú link ${index + 1}`}
                  value={link.note}
                  onChange={(event) =>
                    updateTrace(index, { note: event.target.value })
                  }
                  placeholder="Ghi chú"
                />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive"
                  aria-label={`Xoá trace link ${index + 1}`}
                  onClick={() =>
                    setTraceLinks((links) =>
                      links.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))
          )}
        </FieldGroup>
      </FieldSet>

      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to={backTo} />}
        >
          Huỷ
        </Button>
        <div className="flex-1" />
        <Button onClick={save} disabled={saving}>
          {saving ? <Spinner /> : <CheckIcon />}
          Lưu test case
        </Button>
      </div>
      {saveError && <p className="text-xs text-destructive">{saveError}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2 lg:min-h-0 lg:overflow-hidden">
        <h2 className="text-sm font-semibold text-primary">Live preview</h2>
        <aside className="flex flex-col gap-4 border border-border p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <TestDocumentView doc={previewDocument} />
        </aside>
      </div>
    </div>
  );
}

export function TestDocumentView({
  doc,
}: {
  doc: DocumentDetail;
}) {
  const c = doc.content;
  const isUnit = doc.docType === DocumentType.UnitTest;
  const resolvedByKey = new Map(
    doc.resolvedLinks.map((link) => [link.targetDocKey, link]),
  );
  const steps = c.listItems.filter(
    (item) => item.itemType === SYSTEM_TEST_STEP,
  );

  return (
    <article className="overflow-hidden border border-border bg-background">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <span className="font-mono text-xs font-semibold">{doc.docKey}</span>
        <Badge variant="outline">
          {isUnit
            ? UnitTestTypeLabel[c.unitTestType ?? UnitTestType.Happy]
            : systemTestTypeLabel(c.systemTestType ?? 0)}
        </Badge>
        <Badge variant="secondary">
          {TestSuiteLabel[c.testSuite ?? TestSuite.Full]}
        </Badge>
        <Badge variant="default">
          {TestPriorityLabel[c.testPriority ?? TestPriority.P3]}
        </Badge>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3">
        {isUnit ? (
          <>
            <TestField label="Module" value={c.module} />
            <TestField label="Unit under test" value={c.unitUnderTest} />
            <TestField label="Owner" value={c.testOwnerName ?? c.ownerName} />
            <TestField
              label="Precondition / Mock setup"
              value={c.mockSetup}
              wide
            />
            <TestField label="Input" value={c.input} wide />
            <TestField label="Expected output" value={c.expectedOutput} wide />
          </>
        ) : (
          <>
            <TestField label="Story" value={c.storyKey} />
            <TestField label="Owner" value={c.testOwnerName ?? c.ownerName} />
            <TestField
              label="Loại"
              value={systemTestTypeLabel(c.systemTestType ?? 0)}
            />
            <TestField label="Precondition" value={c.testPrecondition} wide />
            <div className="border-b border-r border-border/50 p-4 sm:col-span-2 lg:col-span-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Steps
              </p>
              {steps.length > 0 ? (
                <ol className="space-y-1 pl-5 text-sm">
                  {steps.map((step, index) => (
                    <li key={`${index}-${step.content}`} className="list-decimal">
                      {step.content}
                    </li>
                  ))}
                </ol>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
            <TestField label="Test data" value={c.testData} wide />
            <TestField label="Expected result" value={c.expectedResult} wide />
          </>
        )}
        <TestField label="Rationale" value={c.rationale} wide />
      </div>

      <div className="border-t border-border p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          TEST_LINKS
        </p>
        {c.links.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có trace link.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {c.links.map((link, index) => {
              const resolved = resolvedByKey.get(link.targetDocKey);
              const label = `${link.targetDocKey}${
                link.targetSection ? `/${link.targetSection}` : ""
              }`;
              const content = (
                <>
                  <span className="font-mono text-xs font-medium">{label}</span>
                  {link.note && (
                    <span className="text-xs text-muted-foreground">
                      {link.note}
                    </span>
                  )}
                </>
              );
              return (
                <li key={`${label}-${index}`}>
                  {resolved?.targetDocumentId ? (
                    <Link
                      to={`/projects/${doc.projectId}/documents/${resolved.targetDocumentId}`}
                      className="flex items-center justify-between gap-3 border border-border/60 p-3 hover:border-primary/50 hover:bg-primary/5"
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
                        {content}
                      </span>
                      <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-0.5 border border-dashed border-border p-3">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </article>
  );
}

function TestField({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | null | undefined;
  wide?: boolean;
}) {
  return (
    <div
      className={`border-b border-r border-border/50 p-4 ${
        wide ? "sm:col-span-2 lg:col-span-3" : ""
      }`}
    >
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">
        {value || "—"}
      </p>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  options: { value: number; label: string }[];
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NumberSelect
        id={id}
        value={value}
        onChange={onChange}
        options={options}
      />
    </Field>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}

function LongField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </Field>
  );
}
