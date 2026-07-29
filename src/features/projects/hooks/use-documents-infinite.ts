import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { PROJECT_STALE, projectKeys } from "@/lib/query-keys";
import { useInfiniteQuery } from "@tanstack/react-query";
import documentService, {
  type DocumentListParams,
} from "../document-services";

const hasAuthBackend = !!authConfig.baseURL;

type Params = Omit<DocumentListParams, "pageIndex" | "anchorDocumentId">;

/**
 * Danh sách tài liệu cuộn vô hạn HAI CHIỀU.
 *
 * Trang đầu tiên không phải trang 1 mà là trang CHỨA `anchorDocumentId` — backend tự tính vị
 * trí của nó trong tập đã lọc (xem DocumentFilter.AnchorDocumentId). Nhờ vậy người dùng mở
 * thẳng một tài liệu nằm giữa danh sách vẫn thấy nó, và cuộn được về cả hai phía. Nếu bắt đầu
 * từ trang 1 thì mở tài liệu thứ 200 sẽ nhìn vào một dãy tab không có cái nào sáng lên.
 *
 * `pageParam` null nghĩa là "để backend chọn trang theo neo"; sau đó là số trang cụ thể, lấy
 * từ `pageIndex` mà chính phản hồi trả về nên client không phải tự đoán mình đang ở đâu.
 */
export const useDocumentsInfinite = (
  projectId: string | undefined,
  params: Params,
  anchorDocumentId: string | undefined,
) => {
  const hasToken = useAuthStore((s) => !!s.accessToken);

  const query = useInfiniteQuery({
    queryKey: projectKeys.documentsInfinite(projectId ?? "", {
      ...params,
      anchorDocumentId,
    }),
    queryFn: ({ pageParam }) =>
      documentService.list(
        projectId!,
        pageParam == null
          ? { ...params, anchorDocumentId }
          : { ...params, pageIndex: pageParam },
      ),
    initialPageParam: null as number | null,
    getNextPageParam: (last) =>
      last.hasNextPage ? last.pageIndex + 1 : undefined,
    getPreviousPageParam: (first) =>
      first.hasPreviousPage ? first.pageIndex - 1 : undefined,
    enabled: !!projectId && hasToken && hasAuthBackend,
    staleTime: PROJECT_STALE,
  });

  return {
    documents: query.data?.pages.flatMap((page) => page.items) ?? [],
    totalCount: query.data?.pages[0]?.totalCount ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    fetchNextPage: query.fetchNextPage,
    fetchPreviousPage: query.fetchPreviousPage,
    hasNextPage: query.hasNextPage,
    hasPreviousPage: query.hasPreviousPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isFetchingPreviousPage: query.isFetchingPreviousPage,
  };
};
