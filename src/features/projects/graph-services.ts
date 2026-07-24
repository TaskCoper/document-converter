import authApi, { type BaseResponse } from "@/lib/auth/api";
import type {
  ErrorCodeRegistry,
  GraphView,
  LinkIssue,
} from "./document-types";

// Đồ thị/sức khoẻ liên kết CẢ PROJECT (GraphController, chỉ đọc). Khác documentService — các
// method ở đây theo projectId, không phải documentId.
class GraphService {
  getProjectGraph = async (projectId: string) => {
    const { data } = await authApi.get<BaseResponse<GraphView>>(
      `/projects/${projectId}/graph`,
    );
    return data.value;
  };

  getLinkIssues = async (projectId: string, staleDays?: number) => {
    const { data } = await authApi.get<BaseResponse<LinkIssue[]>>(
      `/projects/${projectId}/link-issues`,
      { params: { staleDays } },
    );
    return data.value;
  };

  getErrorCodes = async (projectId: string) => {
    const { data } = await authApi.get<BaseResponse<ErrorCodeRegistry>>(
      `/projects/${projectId}/error-codes`,
    );
    return data.value;
  };
}

const graphService = new GraphService();
export default graphService;
