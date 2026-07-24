import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import type { VersionDetail } from "../document-types";
import { errorDetail } from "../error";
import { useReleaseDocument } from "../hooks/use-release-mutations";

interface ReleaseDocumentDialogProps {
  projectId: string;
  documentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReleased: (version: VersionDetail) => void;
}

// Đóng băng bản nháp hiện tại thành 1 version mới và xếp hàng publish lên GitHub (backend tự
// tạo PublishJob, không gọi GitHub trực tiếp ở đây) — xem ReleaseController ở backend.
export function ReleaseDocumentDialog({
  projectId,
  documentId,
  open,
  onOpenChange,
  onReleased,
}: ReleaseDocumentDialogProps) {
  const [versionLabel, setVersionLabel] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const release = useReleaseDocument(projectId, documentId);

  const reset = () => {
    setVersionLabel("");
    setChangeSummary("");
    setSubmitError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = () => {
    setSubmitError(null);
    release.mutate(
      {
        versionLabel: versionLabel.trim() || null,
        changeSummary: changeSummary.trim() || null,
      },
      {
        onSuccess: (version) => {
          reset();
          onReleased(version);
        },
        onError: (err) =>
          setSubmitError(errorDetail(err, "Không phát hành được tài liệu.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="min-w-lg">
        <DialogHeader>
          <DialogTitle>Phát hành tài liệu</DialogTitle>
          <DialogDescription>
            Đóng băng nội dung bản nháp hiện tại thành một phiên bản mới và
            xếp hàng đẩy lên GitHub.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field className="gap-1">
            <FieldLabel htmlFor="release-label">
              Nhãn phiên bản (tuỳ chọn)
            </FieldLabel>
            <Input
              id="release-label"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              placeholder="vd: v1.2"
              autoFocus
            />
          </Field>

          <Field className="gap-1">
            <FieldLabel htmlFor="release-summary">
              Tóm tắt thay đổi (tuỳ chọn)
            </FieldLabel>
            <Textarea
              id="release-summary"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              rows={3}
              placeholder="Những gì đã thay đổi so với lần phát hành trước"
            />
          </Field>

          {submitError && (
            <p className="text-xs text-destructive">{submitError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={release.isPending}>
            {release.isPending && <Spinner />}
            Phát hành
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
