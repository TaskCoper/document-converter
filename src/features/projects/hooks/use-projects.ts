import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { projectKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import projectService from "../services";

// Chỉ gọi backend khi thực sự có backend + phiên thật (không phải fake token dev).
const hasAuthBackend = !!authConfig.baseURL;

export const useProjects = () => {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const isFake = useAuthStore((s) => s.isFake);

  const query = useQuery({
    queryKey: projectKeys.lists(),
    queryFn: projectService.list,
    enabled: hasToken && !isFake && hasAuthBackend,
  });

  return {
    projects: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    noBackend: !hasAuthBackend || isFake,
  };
};
