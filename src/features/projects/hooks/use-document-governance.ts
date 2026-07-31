import documentService from "@/features/projects/document-services";
import { projectKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useDocumentGovernance(documentId: string) {
  return useQuery({
    queryKey: projectKeys.documentGovernance(documentId),
    queryFn: () => documentService.getGovernance(documentId),
    enabled: !!documentId,
  });
}
