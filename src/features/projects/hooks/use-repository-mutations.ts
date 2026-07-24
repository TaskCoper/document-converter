import { projectKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import repositoryConfigService from "../repository-services";
import type {
  AddRepositoryFormValues,
  UpdateRepositoryFormValues,
} from "../repository-validations";

const useInvalidate = (projectId: string) => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: projectKeys.repositories(projectId),
    });
};

export const useAddRepository = (projectId: string) => {
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: (values: AddRepositoryFormValues) =>
      repositoryConfigService.add(projectId, values),
    onSuccess: invalidate,
  });
};

export const useUpdateRepository = (projectId: string) => {
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: ({
      repositoryId,
      values,
    }: {
      repositoryId: string;
      // token bỏ trống → không gửi field để backend giữ token cũ.
      values: Omit<UpdateRepositoryFormValues, "token"> & { token?: string };
    }) => repositoryConfigService.update(projectId, repositoryId, values),
    onSuccess: invalidate,
  });
};

export const useDeleteRepository = (projectId: string) => {
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: (repositoryId: string) =>
      repositoryConfigService.remove(projectId, repositoryId),
    onSuccess: invalidate,
  });
};

// Test KHÔNG cần invalidate (không đổi dữ liệu); component tự giữ kết quả để hiển thị.
export const useTestRepository = (projectId: string) =>
  useMutation({
    mutationFn: (repositoryId: string) =>
      repositoryConfigService.test(projectId, repositoryId),
  });
