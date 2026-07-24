import { DocumentType, DocumentTypeLabel } from "@/features/projects/document-types";
import { useDocuments } from "@/features/projects/hooks/use-documents";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

// Màu viền trên mỗi tab, giống cách Excel/Google Sheets tô màu tab.
const TYPE_BORDER: Record<DocumentType, string> = {
  [DocumentType.UserStory]: "border-t-primary",
  [DocumentType.Tdd]: "border-t-blue-500",
  [DocumentType.BusinessRule]: "border-t-amber-500",
};

export function DocumentTabBar({
  projectId,
  currentDocumentId,
}: {
  projectId: string;
  currentDocumentId?: string;
}) {
  // pageSize lớn để lấy gần như toàn bộ tài liệu dự án trong 1 lần — phù hợp quy mô dự án
  // nhỏ mà app này nhắm tới (không có endpoint "lấy tất cả" riêng, giống graph/error-codes).
  const { documents, isLoading } = useDocuments(projectId, { pageSize: 200 });

  if (isLoading || documents.length === 0) return null;

  // Chỉ điều hướng nhanh giữa các tài liệu CÙNG LOẠI với tài liệu đang xem — ở trang chi
  // tiết 1 User Story thì chỉ hiện các User Story khác, không lẫn TDD/Business Rule.
  const currentDoc = documents.find((d) => d.id === currentDocumentId);
  if (!currentDoc) return null;

  const sameTypeDocs = documents
    .filter((d) => d.docType === currentDoc.docType)
    .sort((a, b) => a.docKey.localeCompare(b.docKey));

  return (
    <div className="flex h-8 shrink-0 items-stretch overflow-x-auto border-t border-border bg-muted/40">
      {sameTypeDocs.map((doc) => {
        const isActive = doc.id === currentDocumentId;
        return (
          <Link
            key={doc.id}
            to={`/projects/${projectId}/documents/${doc.id}`}
            title={`${DocumentTypeLabel[doc.docType]} — ${doc.title}`}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap border-t-2 px-3 font-mono text-[11px] transition-colors",
              isActive
                ? cn("bg-background text-foreground", TYPE_BORDER[doc.docType])
                : "border-t-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            {doc.docKey}
          </Link>
        );
      })}
    </div>
  );
}
