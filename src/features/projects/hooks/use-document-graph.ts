import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { PROJECT_STALE, projectKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import documentService from "../document-services";

const hasAuthBackend = !!authConfig.baseURL;

function useGraphEnabled(documentId: string | undefined) {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  return !!documentId && hasToken && hasAuthBackend;
}

// Tài liệu nào đang trỏ TỚI documentId — dùng ở trang sửa để biết sửa cái gì có thể ảnh
// hưởng ngược lại những tài liệu đang tham chiếu tới nó.
export function useIncomingLinks(documentId: string | undefined) {
  const enabled = useGraphEnabled(documentId);
  const query = useQuery({
    queryKey: projectKeys.incomingLinks(documentId ?? ""),
    queryFn: () => documentService.getIncomingLinks(documentId!),
    enabled,
    staleTime: PROJECT_STALE,
  });
  return {
    links: query.data ?? [],
    isLoading: enabled && query.isLoading,
  };
}

// Sửa documentId thì những tài liệu nào (theo cạnh DependsOn/Implements/GovernedBy/Blocks)
// cần được xem lại.
export function useImpact(documentId: string | undefined, depth = 3) {
  const enabled = useGraphEnabled(documentId);
  const query = useQuery({
    queryKey: projectKeys.impact(documentId ?? "", depth),
    queryFn: () => documentService.getImpact(documentId!, depth),
    enabled,
    staleTime: PROJECT_STALE,
  });
  return {
    report: query.data ?? null,
    impacted: query.data?.impacted ?? [],
    isLoading: enabled && query.isLoading,
  };
}

// Outgoing links KHÔNG còn hook riêng: GET /documents/{id} đã trả sẵn `resolvedLinks` (backend
// nối docKey→id ngay trong truy vấn có sẵn). Trước đây phải tải cả danh sách tài liệu của
// project về rồi tự đối chiếu khoá — một request PageSize=100/200 chỉ để dịch vài chuỗi, mà
// còn sai âm thầm vì backend chặn PageSize ở 100.
