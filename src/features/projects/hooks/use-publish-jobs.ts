import { useAuthStore } from "@/features/auth/store";
import authConfig from "@/lib/auth/config";
import { projectKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import repositoryConfigService from "../repository-services";
import { PublishStatus, type PublishJobRow } from "../repository-types";

const hasAuthBackend = !!authConfig.baseURL;

// Backend không có webhook/SignalR đẩy trạng thái job về client — phải tự poll. Chỉ poll khi
// còn job Pending/Running (đang chờ hoặc đang chạy); dừng poll khi hàng đợi đã yên (mọi job đều
// ở trạng thái cuối: Succeeded/Failed/Cancelled) để khỏi gọi API vô ích.
const POLL_MS = 5000;

export const usePublishJobs = (projectId: string | undefined) => {
  const hasToken = useAuthStore((s) => !!s.accessToken);

  const query = useQuery({
    queryKey: projectKeys.publishJobs(projectId ?? ""),
    queryFn: () => repositoryConfigService.getPublishJobs(projectId!),
    enabled: !!projectId && hasToken && hasAuthBackend,
    refetchInterval: (q) => {
      const jobs = (q.state.data as PublishJobRow[] | undefined) ?? [];
      const active = jobs.some(
        (j) =>
          j.status === PublishStatus.Pending ||
          j.status === PublishStatus.Running,
      );
      return active ? POLL_MS : false;
    },
  });

  return {
    jobs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
