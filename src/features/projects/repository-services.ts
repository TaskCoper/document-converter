import authApi, { type BaseResponse } from "@/lib/auth/api";
import type {
  ConnectionTest,
  PublishCycleResult,
  PublishJobRow,
  RepositoryInfo,
} from "./repository-types";

// Cấu hình repo GitHub theo project (PublishController). Toàn bộ yêu cầu quyền Admin+.
class RepositoryConfigService {
  list = async (projectId: string) => {
    const { data } = await authApi.get<BaseResponse<RepositoryInfo[]>>(
      `/projects/${projectId}/repositories`,
    );
    return data.value;
  };

  add = async (
    projectId: string,
    body: {
      owner: string;
      name: string;
      defaultBranch: string;
      basePath: string;
      token: string;
    },
  ) => {
    const { data } = await authApi.post<BaseResponse<RepositoryInfo>>(
      `/projects/${projectId}/repositories`,
      body,
    );
    return data.value;
  };

  update = async (
    projectId: string,
    repositoryId: string,
    // token undefined/bỏ trống = giữ token cũ.
    body: {
      defaultBranch: string;
      basePath: string;
      isActive: boolean;
      token?: string;
    },
  ) => {
    const { data } = await authApi.put<BaseResponse<RepositoryInfo>>(
      `/projects/${projectId}/repositories/${repositoryId}`,
      body,
    );
    return data.value;
  };

  remove = async (projectId: string, repositoryId: string) => {
    await authApi.delete<BaseResponse<null>>(
      `/projects/${projectId}/repositories/${repositoryId}`,
    );
  };

  test = async (projectId: string, repositoryId: string) => {
    const { data } = await authApi.post<BaseResponse<ConnectionTest>>(
      `/projects/${projectId}/repositories/${repositoryId}/test`,
      {},
    );
    return data.value;
  };

  // ── Hàng đợi publish (PublishController) ──────────────────────────────────────────
  getPublishJobs = async (projectId: string) => {
    const { data } = await authApi.get<BaseResponse<PublishJobRow[]>>(
      `/projects/${projectId}/publish-jobs`,
    );
    return data.value;
  };

  retryPublishJob = async (projectId: string, jobId: string) => {
    await authApi.post<BaseResponse<null>>(
      `/projects/${projectId}/publish-jobs/${jobId}/retry`,
    );
  };

  // Xử lý hàng đợi TOÀN HỆ THỐNG (không riêng project này) — xem ghi chú ở PublishCycleResult.
  runPublishCycle = async (projectId: string) => {
    const { data } = await authApi.post<BaseResponse<PublishCycleResult>>(
      `/projects/${projectId}/publish-jobs/run`,
    );
    return data.value;
  };
}

const repositoryConfigService = new RepositoryConfigService();
export default repositoryConfigService;
