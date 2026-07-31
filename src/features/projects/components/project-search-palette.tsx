import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  ApprovalStateLabel,
  DocumentType,
  DocumentTypeLabel,
  type SearchHit,
} from "@/features/projects/document-types";
import { useProjectSearch } from "@/features/projects/hooks/use-project-search";
import { cn } from "@/lib/utils";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TYPE_CHIPS: { label: string; value: DocumentType | undefined }[] = [
  { label: "Tất cả", value: undefined },
  { label: "User Story", value: DocumentType.UserStory },
  { label: "TDD", value: DocumentType.Tdd },
  { label: "Business Rule", value: DocumentType.BusinessRule },
  { label: "Unit Test", value: DocumentType.UnitTest },
  { label: "System Test", value: DocumentType.SystemTest },
];

// Đoạn trích trả về từ backend bọc từ khớp trong **...** (xem SearchService.Highlight).
function HighlightText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-primary/20 text-foreground">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

interface Props {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Overlay tìm kiếm kiểu Spotlight — DialogOverlay (base-ui) đã tự blur nền + đóng khi bấm ra
// ngoài/Escape, chỉ cần định vị popup ở top-center và tự dựng nội dung ô tìm + kết quả.
export function ProjectSearchPalette({ projectId, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [docType, setDocType] = useState<DocumentType | undefined>(undefined);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const { result, hits, isLoading } = useProjectSearch(projectId, {
    q: debouncedQ,
    docType,
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setQ("");
      setDebouncedQ("");
      setDocType(undefined);
    }
    onOpenChange(next);
  };

  const openHit = (hit: SearchHit) => {
    handleOpenChange(false);
    navigate(`/projects/${projectId}/documents/${hit.documentId}`);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        position="top-center"
        className="mt-[10vh] w-full max-w-2xl gap-0 p-0 sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">Tìm kiếm tài liệu</DialogTitle>

        <div className="flex items-center gap-2 border-b border-border px-3">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && hits[0]) {
                e.preventDefault();
                openHit(hits[0]);
              }
            }}
            placeholder="Tìm Story / TDD / Rule / Test trong dự án…"
            className="h-11 flex-1 border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
          />
          {isLoading && <Spinner className="size-3.5 shrink-0" />}
        </div>

        <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
          {TYPE_CHIPS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setDocType(c.value)}
              className={cn(
                "rounded-none border px-2 py-0.5 text-[10px] transition-colors",
                docType === c.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/30",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {!debouncedQ.trim() ? (
            <p className="p-6 text-center text-xs text-muted-foreground">
              Nhập từ khoá để tìm trong dự án.
            </p>
          ) : isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : hits.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted-foreground">
              Không tìm thấy kết quả cho "{debouncedQ}".
            </p>
          ) : (
            <ul>
              {hits.map((hit) => (
                <li key={hit.documentId}>
                  <button
                    type="button"
                    onClick={() => openHit(hit)}
                    className="flex w-full flex-col gap-0.5 border-b border-border/60 px-3 py-2 text-left transition-colors hover:bg-primary/5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {hit.docKey}
                      </span>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {DocumentTypeLabel[hit.docType]}
                      </Badge>
                      <span className="truncate text-xs font-medium">
                        {hit.title}
                      </span>
                      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                        {hit.isArchived
                          ? "Lưu trữ"
                          : ApprovalStateLabel[hit.approvalState]}
                      </span>
                    </div>
                    {hit.highlight && (
                      <p className="line-clamp-2 text-[11px] text-muted-foreground">
                        <HighlightText text={hit.highlight} />
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {result && !result.usedSemantic && result.semanticSkippedReason && (
            <p className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
              Thông tin tìm kiếm ngữ nghĩa: {result.semanticSkippedReason}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
