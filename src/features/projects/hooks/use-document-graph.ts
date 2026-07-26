import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { projectKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import documentService from "../document-services";
import type { LinkSnapshot } from "../document-types";
import { useDocuments } from "./use-documents";

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
  });
  return {
    report: query.data ?? null,
    impacted: query.data?.impacted ?? [],
    isLoading: enabled && query.isLoading,
  };
}

export interface ResolvedOutgoingLink extends LinkSnapshot {
  target?: { id: string; title: string; docType: number };
}

// Links[] trong DocumentDetail.content chỉ có targetDocKey (chuỗi thô, không có id/title) —
// đối chiếu với danh sách tài liệu của project để dựng link bấm được cho panel "Tài liệu liên
// quan". Không phải API đồ thị (GraphController chỉ đọc incoming-links/impact, không có
// endpoint trả outgoing links đã resolve), nên phải tự khớp phía client.
export function useOutgoingLinks(
  projectId: string | undefined,
  links: LinkSnapshot[],
) {
  const enabled = !!projectId && links.length > 0;
  const { documents, isLoading } = useDocuments(
    enabled ? projectId : undefined,
    { pageSize: 100 },
  );

  const byKey = new Map(documents.map((d) => [d.docKey.trim().toUpperCase(), d]));
  const resolved: ResolvedOutgoingLink[] = links.map((l) => {
    const doc = byKey.get(l.targetDocKey.trim().toUpperCase());
    return {
      ...l,
      target: doc ? { id: doc.id, title: doc.title, docType: doc.docType } : undefined,
    };
  });

  return {
    outgoing: resolved,
    isLoading: enabled && isLoading,
  };
}
