import { Spinner } from "@/components/ui/spinner";
import {
  DocumentLinkTypeLabel,
  type ResolvedLink,
} from "@/features/projects/document-types";
import {
  useImpact,
  useIncomingLinks,
} from "@/features/projects/hooks/use-document-graph";
import type { GraphSatellite } from "./related-documents-graph";
import { RelatedDocumentsGraph } from "./related-documents-graph";

function linkTypeLabel(linkType: number): string {
  return (
    DocumentLinkTypeLabel[linkType as keyof typeof DocumentLinkTypeLabel] ??
    String(linkType)
  );
}

// Gọi 2 API đồ thị (GraphController, chỉ đọc) để trả lời "sửa tài liệu này thì cái gì liên
// quan": incoming-links = ai đang trỏ tới nó, impact = sửa nó thì cái gì cần xem lại. Mục
// "outgoing" thì không cần gọi gì thêm — GET /documents/{id} đã trả kèm resolvedLinks, và đây
// thường là mục có dữ liệu nhất (tài liệu mới tạo thường CHƯA có gì trỏ vào/phụ thuộc nó,
// nhưng đã tự khai tham chiếu ra tài liệu khác). Hiển thị dạng đồ thị hub-and-spoke: tài liệu
// đang sửa ở giữa, các tài liệu liên quan là vệ tinh nối bằng đường có mũi tên — xem
// RelatedDocumentsGraph.
export function RelatedDocumentsPanel({
  projectId,
  documentId,
  currentDocKey,
  currentTitle,
  currentDocType,
  outgoingLinks = [],
}: {
  projectId: string;
  documentId: string;
  currentDocKey: string;
  currentTitle?: string;
  currentDocType?: number;
  outgoingLinks?: ResolvedLink[];
}) {
  const { links: incomingLinks, isLoading: incomingLoading } =
    useIncomingLinks(documentId);
  const { impacted, isLoading: impactLoading } = useImpact(documentId);

  const isLoading = incomingLoading || impactLoading;

  const satellites: GraphSatellite[] = [
    ...outgoingLinks.map((l, i) => ({
      key: `out-${l.targetDocKey}-${l.linkType}-${i}`,
      kind: "outgoing" as const,
      docKey: l.targetDocKey,
      title: l.targetTitle ?? undefined,
      docType: l.targetDocType ?? undefined,
      // Không có id = liên kết còn treo (trỏ tới khoá chưa tồn tại) → hiện nhưng không bấm được.
      href: l.targetDocumentId
        ? `/projects/${projectId}/documents/${l.targetDocumentId}`
        : undefined,
      edgeLabel: linkTypeLabel(l.linkType),
    })),
    ...incomingLinks.map((l) => ({
      key: `in-${l.sourceDocumentId}-${l.linkType}`,
      kind: "incoming" as const,
      docKey: l.sourceDocKey,
      title: l.sourceTitle,
      docType: l.sourceDocType,
      href: `/projects/${projectId}/documents/${l.sourceDocumentId}`,
      edgeLabel: linkTypeLabel(l.linkType),
    })),
    ...impacted.map((d) => ({
      key: `impact-${d.documentId}`,
      kind: "impact" as const,
      docKey: d.docKey,
      title: d.title,
      docType: d.docType,
      href: `/projects/${projectId}/documents/${d.documentId}`,
      edgeLabel: linkTypeLabel(d.viaLinkType),
      edgeDetail: `cách ${d.depth} bước · ${linkTypeLabel(d.viaLinkType)}${d.isReleased ? " · đã phát hành" : ""}`,
    })),
  ];

  return (
    <div className="flex flex-col gap-4 border border-border bg-background p-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold text-primary">
          Tài liệu liên quan
        </h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner className="size-4" />
        </div>
      ) : satellites.length === 0 ? (
        <p className="text-[11px] italic text-muted-foreground">
          Chưa có tài liệu nào tham chiếu hoặc phụ thuộc vào tài liệu này.
        </p>
      ) : (
        <RelatedDocumentsGraph
          current={{
            docKey: currentDocKey,
            title: currentTitle,
            docType: currentDocType,
          }}
          satellites={satellites}
        />
      )}
    </div>
  );
}
