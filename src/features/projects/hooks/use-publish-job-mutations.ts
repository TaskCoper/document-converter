import { projectKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import repositoryConfigService from "../repository-services";

const useInvalidate = (projectId: string) => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: projectKeys.publishJobs(projectId),
    });
};

export const useRetryPublishJob = (projectId: string) => {
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: (jobId: string) =>
      repositoryConfigService.retryPublishJob(projectId, jobId),
    onSuccess: invalidate,
  });
};

// Chạy 1 chu kỳ publish TOÀN HỆ THỐNG — chỉ invalidate danh sách job của project đang xem
// (đủ cho UI này hiển thị), không cố invalidate cache của các project khác mà trang không biết.
export const useRunPublishCycle = (projectId: string) => {
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: () => repositoryConfigService.runPublishCycle(projectId),
    onSuccess: invalidate,
  });
};
