import authApi, { type BaseResponse } from "@/lib/auth/api";
import type {
  MemberInfo,
  ProjectDetail,
  ProjectRole,
  ProjectSummary,
} from "./types";

// Toàn bộ project đi qua backend (authApi), KHÔNG qua GitHub. Vai trò gửi/nhận là SỐ.
class ProjectService {
  list = async () => {
    const { data } =
      await authApi.get<BaseResponse<ProjectSummary[]>>(`/projects`);
    return data.value;
  };

  get = async (projectId: string) => {
    const { data } = await authApi.get<BaseResponse<ProjectDetail>>(
      `/projects/${projectId}`,
    );
    return data.value;
  };

  create = async (body: {
    code: string;
    name: string;
    description: string;
  }) => {
    const { data } = await authApi.post<BaseResponse<ProjectDetail>>(
      `/projects`,
      body,
    );
    return data.value;
  };

  update = async (
    projectId: string,
    body: { name: string; description: string },
  ) => {
    const { data } = await authApi.put<BaseResponse<ProjectDetail>>(
      `/projects/${projectId}`,
      body,
    );
    return data.value;
  };

  remove = async (projectId: string) => {
    await authApi.delete<BaseResponse<null>>(`/projects/${projectId}`);
  };

  listMembers = async (projectId: string) => {
    const { data } = await authApi.get<BaseResponse<MemberInfo[]>>(
      `/projects/${projectId}/members`,
    );
    return data.value;
  };

  addMember = async (
    projectId: string,
    body: { email: string; role: ProjectRole },
  ) => {
    const { data } = await authApi.post<BaseResponse<MemberInfo>>(
      `/projects/${projectId}/members`,
      body,
    );
    return data.value;
  };

  changeMemberRole = async (
    projectId: string,
    userId: string,
    role: ProjectRole,
  ) => {
    const { data } = await authApi.put<BaseResponse<MemberInfo>>(
      `/projects/${projectId}/members/${userId}`,
      { role },
    );
    return data.value;
  };

  removeMember = async (projectId: string, userId: string) => {
    await authApi.delete<BaseResponse<null>>(
      `/projects/${projectId}/members/${userId}`,
    );
  };
}

const projectService = new ProjectService();
export default projectService;
