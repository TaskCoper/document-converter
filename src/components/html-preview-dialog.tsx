import { Download, FileCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function HtmlPreviewDialog({
  html,
  onClose,
  onDownload,
}: {
  html: string | null;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <Dialog
      open={html !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        position="top-center"
        className="flex flex-col min-w-[98vw] h-full p-0 gap-0"
      >
        <DialogHeader className="flex-row items-center gap-2 px-4 py-3 border-b border-border shrink-0">
          <FileCode className="size-4 text-primary shrink-0" />
          <DialogTitle className="flex-1">Xem trước HTML</DialogTitle>
        </DialogHeader>

        <iframe
          srcDoc={html ?? ""}
          className="flex-1 w-full border-0 min-h-0"
          title="HTML Preview"
          sandbox="allow-same-origin"
        />

        <DialogFooter className="px-4 py-3 border-t border-border shrink-0">
          <Button size="sm" onClick={onDownload}>
            <Download />
            Tải xuống
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
