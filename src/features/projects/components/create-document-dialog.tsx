import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import {
  DocumentType,
  DocumentTypeLabel,
  type DocumentDetail,
} from "../document-types";
import { errorDetail } from "../error";
import { useCreateDocument } from "../hooks/use-document-mutations";
import { NumberSelect } from "./number-select";

interface CreateDocumentDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (doc: DocumentDetail) => void;
}

const TYPE_OPTIONS = [
  { value: DocumentType.UserStory, label: DocumentTypeLabel[DocumentType.UserStory] },
  { value: DocumentType.Tdd, label: DocumentTypeLabel[DocumentType.Tdd] },
  {
    value: DocumentType.BusinessRule,
    label: DocumentTypeLabel[DocumentType.BusinessRule],
  },
  { value: DocumentType.UnitTest, label: DocumentTypeLabel[DocumentType.UnitTest] },
  {
    value: DocumentType.SystemTest,
    label: DocumentTypeLabel[DocumentType.SystemTest],
  },
];

export function CreateDocumentDialog({
  projectId,
  open,
  onOpenChange,
  onCreated,
}: CreateDocumentDialogProps) {
  const [docType, setDocType] = useState<DocumentType>(DocumentType.UserStory);
  const [title, setTitle] = useState("");
  const [keyPrefix, setKeyPrefix] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createDocument = useCreateDocument(projectId);

  const reset = () => {
    setDocType(DocumentType.UserStory);
    setTitle("");
    setKeyPrefix("");
    setTitleError(null);
    setSubmitError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = () => {
    setSubmitError(null);
    if (!title.trim()) {
      setTitleError("Vui lòng nhập tiêu đề");
      return;
    }
    setTitleError(null);
    createDocument.mutate(
      {
        docType,
        title: title.trim(),
        keyPrefix: keyPrefix.trim() || undefined,
      },
      {
        onSuccess: (doc) => {
          reset();
          onCreated(doc);
        },
        onError: (err) =>
          setSubmitError(errorDetail(err, "Không tạo được tài liệu.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:min-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo tài liệu</DialogTitle>
          <DialogDescription>
            Mã tài liệu (STORY / TDD / BR / UT / ST) sẽ được cấp tự động.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field className="gap-1">
            <FieldLabel htmlFor="doc-type">Loại</FieldLabel>
            <NumberSelect
              id="doc-type"
              value={docType}
              onChange={(v) => {
                setDocType(v as DocumentType);
                setKeyPrefix("");
              }}
              options={TYPE_OPTIONS}
            />
          </Field>

          {(docType === DocumentType.UnitTest ||
            docType === DocumentType.SystemTest) && (
            <Field className="gap-1">
              <FieldLabel htmlFor="doc-key-prefix">
                Tiền tố Test ID
              </FieldLabel>
              <Input
                id="doc-key-prefix"
                value={keyPrefix}
                onChange={(e) => setKeyPrefix(e.target.value.toUpperCase())}
                placeholder={
                  docType === DocumentType.UnitTest ? "UT-006" : "ST-011"
                }
                spellCheck={false}
              />
              <p className="text-[10px] text-muted-foreground">
                Ví dụ tiền tố {docType === DocumentType.UnitTest ? "UT-006" : "ST-011"} sẽ
                sinh mã đuôi 01, 02…
              </p>
            </Field>
          )}

          <Field data-invalid={!!titleError || undefined} className="gap-1">
            <FieldLabel htmlFor="doc-title">Tiêu đề</FieldLabel>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="vd: Đăng nhập bằng email"
              autoFocus
            />
            {titleError && (
              <FieldError className="text-xs" errors={[{ message: titleError }]} />
            )}
          </Field>

          {submitError && (
            <p className="text-xs text-destructive">{submitError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={createDocument.isPending}>
            {createDocument.isPending && <Spinner />}
            Tạo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
