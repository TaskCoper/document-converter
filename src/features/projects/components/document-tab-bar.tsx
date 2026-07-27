import { Spinner } from "@/components/ui/spinner";
import {
  DocumentSort,
  DocumentType,
  DocumentTypeLabel,
} from "@/features/projects/document-types";
import { useDocument } from "@/features/projects/hooks/use-document";
import { useDocumentsInfinite } from "@/features/projects/hooks/use-documents-infinite";
import { cn } from "@/lib/utils";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";

// Màu viền trên mỗi tab, giống cách Excel/Google Sheets tô màu tab.
const TYPE_BORDER: Record<DocumentType, string> = {
  [DocumentType.UserStory]: "border-t-primary",
  [DocumentType.Tdd]: "border-t-blue-500",
  [DocumentType.BusinessRule]: "border-t-amber-500",
};

// Đủ lấp chừng một màn hình tab, cuộn tới đâu nạp tới đó.
const PAGE_SIZE = 20;
// Còn cách mép bao nhiêu pixel thì nạp trang kế — nạp trước khi người dùng chạm đáy để
// thanh tab không khựng lại.
const EDGE_PX = 96;

export function DocumentTabBar({
  projectId,
  currentDocumentId,
}: {
  projectId: string;
  currentDocumentId?: string;
}) {
  // Loại tài liệu lấy từ CHÍNH tài liệu đang mở, không phải bằng cách dò nó trong danh sách —
  // với danh sách phân trang thì việc dò đó càng không khả thi. Query này trang chi tiết đã
  // nạp sẵn nên dùng lại cache, không tốn thêm request.
  const { document } = useDocument(currentDocumentId);
  const docType = document?.docType;

  // Lọc theo loại, sắp theo docKey, và NEO trang đầu tiên vào tài liệu đang mở — tất cả ở
  // backend. Mỗi lần chỉ kéo về PAGE_SIZE dòng thay vì cả danh sách.
  const {
    documents,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
  } = useDocumentsInfinite(
    docType != null ? projectId : undefined,
    { docType, sort: DocumentSort.DocKey, pageSize: PAGE_SIZE },
    currentDocumentId,
  );

  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  // scrollWidth đo ngay TRƯỚC khi nạp thêm ở đầu danh sách, để bù lại độ dịch sau đó.
  const widthBeforePrependRef = useRef<number | null>(null);
  // Tài liệu đã được canh vào giữa rồi — canh lại mỗi lần nạp thêm sẽ giật vị trí của người dùng.
  const centeredForRef = useRef<string | undefined>(undefined);

  const ready = docType != null && documents.length > 0;
  // Đổi phần tử đầu = vừa chèn thêm ở đầu danh sách. Dùng tín hiệu này thay cho số lượng để
  // lần nạp ở mép PHẢI (cũng làm số lượng tăng) không kích hoạt nhầm phần bù cuộn.
  const firstDocId = documents[0]?.id;

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;

    if (
      el.scrollWidth - el.scrollLeft - el.clientWidth <= EDGE_PX &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }

    if (el.scrollLeft <= EDGE_PX && hasPreviousPage && !isFetchingPreviousPage) {
      widthBeforePrependRef.current = el.scrollWidth;
      fetchPreviousPage();
    }
  };

  // Tab chèn thêm ở ĐẦU danh sách đẩy toàn bộ nội dung sang phải. Không bù lại thì thanh tab
  // nhảy dưới tay người dùng và chỗ họ đang nhìn trôi mất.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    const before = widthBeforePrependRef.current;
    if (!el || before == null) return;
    widthBeforePrependRef.current = null;
    el.scrollLeft += el.scrollWidth - before;
  }, [firstDocId]);

  // Đưa tab đang mở vào giữa tầm nhìn, một lần cho mỗi tài liệu. Tính tay chứ không dùng
  // scrollIntoView vì hàm đó cuộn cả các phần tử tổ tiên — kéo theo cả trang phía trên.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const active = activeRef.current;
    if (!scroller || !active || !currentDocumentId) return;
    if (centeredForRef.current === currentDocumentId) return;
    centeredForRef.current = currentDocumentId;
    scroller.scrollLeft =
      active.offsetLeft - (scroller.clientWidth - active.offsetWidth) / 2;
  }, [currentDocumentId, ready]);

  // Màn hình rộng mà một trang ít tab thì nội dung không tràn, không có sự kiện scroll nào
  // để kích hoạt việc nạp thêm — kẹt vĩnh viễn ở trang đầu. Nạp tiếp cho tới khi tràn.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!ready || !el) return;
    if (el.scrollWidth <= el.clientWidth && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [ready, documents.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Chuột rời chỉ có trục dọc, không dịch sang trục ngang thì thanh tab đứng im với phần lớn
  // người dùng. Phải đăng ký listener non-passive: React gắn sự kiện wheel ở dạng passive nên
  // preventDefault trong onWheel viết thẳng trong JSX không có tác dụng.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!ready || !el) return;

    const onWheel = (e: WheelEvent) => {
      // Trackpad và chuột ngang đã tự cuộn đúng trục rồi, đừng cộng thêm.
      if (e.deltaY === 0 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ready]);

  if (!ready) return null;

  return (
    <div
      ref={scrollerRef}
      onScroll={onScroll}
      className="relative flex h-8 shrink-0 items-stretch overflow-x-auto border-t border-border bg-muted/40"
    >
      {/* Ô chờ ở hai mép giữ nguyên bề rộng suốt lúc còn trang để nạp, nên spinner hiện ra
          không tự nó làm xê dịch dãy tab. */}
      {hasPreviousPage && <EdgeSlot loading={isFetchingPreviousPage} />}

      {documents.map((doc) => {
        const isActive = doc.id === currentDocumentId;
        return (
          <Link
            key={doc.id}
            ref={isActive ? activeRef : undefined}
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

      {hasNextPage && <EdgeSlot loading={isFetchingNextPage} />}
    </div>
  );
}

function EdgeSlot({ loading }: { loading: boolean }) {
  return (
    <span className="flex w-8 shrink-0 items-center justify-center">
      {loading && <Spinner className="size-3 text-muted-foreground" />}
    </span>
  );
}
