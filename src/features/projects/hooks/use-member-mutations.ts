import { projectKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import projectService from "../services";
import type { ProjectRole } from "../types";
import type { AddMemberFormValues } from "../validations";

// Sau mỗi thay đổi thành viên: refresh cả danh sách thành viên và detail (memberCount)
// và danh sách project (memberCount ở summary).
const useInvalidateMembers = (projectId: string) => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
  };
};

export const useAddMember = (projectId: string) => {
  const invalidate = useInvalidateMembers(projectId);
  return useMutation({
    mutationFn: (values: AddMemberFormValues) =>
      projectService.addMember(projectId, values),
    onSuccess: invalidate,
  });
};

export const useChangeMemberRole = (projectId: string) => {
  const invalidate = useInvalidateMembers(projectId);
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectRole }) =>
      projectService.changeMemberRole(projectId, userId, role),
    onSuccess: invalidate,
  });
};

export const useRemoveMember = (projectId: string) => {
  const invalidate = useInvalidateMembers(projectId);
  return useMutation({
    mutationFn: (userId: string) =>
      projectService.removeMember(projectId, userId),
    onSuccess: invalidate,
  });
};
