import authApi, {
  type BasePaginationResponse,
  type BaseResponse,
} from "@/lib/auth/api";
import type {
  DocumentDetail,
  DocumentGovernance,
  DocumentListRow,
  DocumentSort,
  DocumentType,
  ImpactReport,
  IncomingLink,
  LifecycleState,
  SearchMode,
  SearchResponse,
  SystemTestType,
  TestPriority,
  TestSuite,
  UnitTestType,
  VersionDetail,
  VersionDiff,
  VersionListRow,
} from "./document-types";

export interface DocumentListParams {
  docType?: DocumentType;
  keyword?: string;
  sort?: DocumentSort;
  // Trả về trang CHỨA tài liệu này thay vì trang 1; ghi đè pageIndex khi có giá trị.
  anchorDocumentId?: string;
  pageIndex?: number;
  pageSize?: number;
  unitTestType?: UnitTestType;
  systemTestType?: SystemTestType;
  testSuite?: TestSuite;
  testPriority?: TestPriority;
  module?: string;
  storyKey?: string;
}

export interface SearchParams {
  q: string;
  docType?: DocumentType;
  mode?: SearchMode;
  limit?: number;
}

export interface CreateDocumentBody {
  docType: DocumentType;
  title: string;
  status?: number;
  keyPrefix?: string;
  sprint?: number | null;
  priority?: number | null;
  category?: string | null;
  effectiveDate?: string | null;
}

export interface UpdateMetadataBody {
  title: string;
  status: number;
  lifecycleState: LifecycleState;
  ownerId?: string | null;
  sprint?: number | null;
  priority?: number | null;
  category?: string | null;
  effectiveDate?: string | null;
  notesMd?: string | null;
}

export interface ReleaseDocumentBody {
  versionLabel?: string | null;
  changeSummary?: string | null;
}

export interface UpdateGovernanceBody {
  version: string;
  authorId?: string | null;
  authorName?: string | null;
  reviewerId?: string | null;
  reviewerName?: string | null;
  approverId?: string | null;
  approverName?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
}

// Các field đơn trị theo loại — backend chỉ dùng nhóm khớp doc_type, gửi dư cũng không sao.
export interface UpdateDetailBody {
  // UserStory
  storyStatement?: string | null;
  context?: string | null;
  trigger?: string | null;
  // Tdd
  featureName?: string | null;
  problem?: string | null;
  externalErrorHandling?: string | null;
  reviewerName?: string | null;
  // BusinessRule
  ruleName?: string | null;
  statement?: string | null;
  whenCondition?: string | null;
  thenAction?: string | null;
  exceptCondition?: string | null;
  notes?: string | null;
  ownerName?: string | null;
  source?: string | null;
  // UnitTest
  module?: string | null;
  unitUnderTest?: string | null;
  unitTestType?: UnitTestType | null;
  mockSetup?: string | null;
  input?: string | null;
  expectedOutput?: string | null;
  // SystemTest
  storyKey?: string | null;
  systemTestType?: number | null;
  precondition?: string | null;
  testData?: string | null;
  expectedResult?: string | null;
  // Dùng chung
  testSuite?: TestSuite | null;
  testPriority?: TestPriority | null;
  rationale?: string | null;
  testOwnerName?: string | null;
}

class DocumentService {
  list = async (projectId: string, params: DocumentListParams = {}) => {
    const { data } = await authApi.get<BasePaginationResponse<DocumentListRow>>(
      `/projects/${projectId}/documents`,
      {
        params: {
          DocType: params.docType,
          Keyword: params.keyword || undefined,
          Sort: params.sort,
          AnchorDocumentId: params.anchorDocumentId,
          PageIndex: params.pageIndex ?? 1,
          PageSize: params.pageSize ?? 50,
          UnitTestType: params.unitTestType,
          SystemTestType: params.systemTestType,
          TestSuite: params.testSuite,
          TestPriority: params.testPriority,
          Module: params.module || undefined,
          StoryKey: params.storyKey || undefined,
        },
      },
    );
    return data.value;
  };

  get = async (documentId: string) => {
    const { data } = await authApi.get<BaseResponse<DocumentDetail>>(
      `/documents/${documentId}`,
    );
    return data.value;
  };

  getGovernance = async (documentId: string) => {
    const { data } = await authApi.get<BaseResponse<DocumentGovernance>>(
      `/documents/${documentId}/governance`,
    );
    return data.value;
  };

  updateGovernance = async (
    documentId: string,
    body: UpdateGovernanceBody,
  ) => {
    const { data } = await authApi.put<BaseResponse<DocumentGovernance>>(
      `/documents/${documentId}/governance`,
      body,
    );
    return data.value;
  };

  transitionGovernance = async (
    documentId: string,
    action:
      | "submit-review"
      | "request-changes"
      | "approve"
      | "deprecate"
      | "start-revision",
    note?: string | null,
  ) => {
    const { data } = await authApi.post<BaseResponse<DocumentGovernance>>(
      `/documents/${documentId}/governance/${action}`,
      { note: note ?? null },
    );
    return data.value;
  };

  // Trả về Markdown thô (không phải BaseResponse) — content-type text/markdown.
  preview = async (documentId: string) => {
    const { data } = await authApi.get<string>(
      `/documents/${documentId}/preview`,
      { responseType: "text" },
    );
    return data;
  };

  create = async (projectId: string, body: CreateDocumentBody) => {
    const { data } = await authApi.post<BaseResponse<DocumentDetail>>(
      `/projects/${projectId}/documents`,
      body,
    );
    return data.value;
  };

  updateMetadata = async (documentId: string, body: UpdateMetadataBody) => {
    const { data } = await authApi.put<BaseResponse<DocumentDetail>>(
      `/documents/${documentId}/metadata`,
      body,
    );
    return data.value;
  };

  updateDetail = async (documentId: string, body: UpdateDetailBody) => {
    const { data } = await authApi.put<BaseResponse<DocumentDetail>>(
      `/documents/${documentId}/detail`,
      body,
    );
    return data.value;
  };

  remove = async (documentId: string) => {
    await authApi.delete<BaseResponse<null>>(`/documents/${documentId}`);
  };

  // ── Release & lịch sử version (ReleaseController) ─────────────────────────────────
  release = async (documentId: string, body: ReleaseDocumentBody) => {
    const { data } = await authApi.post<BaseResponse<VersionDetail>>(
      `/documents/${documentId}/release`,
      body,
    );
    return data.value;
  };

  getVersions = async (documentId: string) => {
    const { data } = await authApi.get<BaseResponse<VersionListRow[]>>(
      `/documents/${documentId}/versions`,
    );
    return data.value;
  };

  getVersion = async (documentId: string, versionNumber: number) => {
    const { data } = await authApi.get<BaseResponse<VersionDetail>>(
      `/documents/${documentId}/versions/${versionNumber}`,
    );
    return data.value;
  };

  // Markdown thô đã đóng băng của version — cùng kiểu response với preview().
  getVersionMarkdown = async (documentId: string, versionNumber: number) => {
    const { data } = await authApi.get<string>(
      `/documents/${documentId}/versions/${versionNumber}/markdown`,
      { responseType: "text" },
    );
    return data;
  };

  getVersionDiff = async (documentId: string, from: number, to: number) => {
    const { data } = await authApi.get<BaseResponse<VersionDiff>>(
      `/documents/${documentId}/versions/diff`,
      { params: { from, to } },
    );
    return data.value;
  };

  restoreVersion = async (documentId: string, versionNumber: number) => {
    await authApi.post<BaseResponse<null>>(
      `/documents/${documentId}/versions/${versionNumber}/restore`,
    );
  };

  // ── Đồ thị liên kết (GraphController, chỉ đọc) ────────────────────────────────────
  getIncomingLinks = async (documentId: string) => {
    const { data } = await authApi.get<BaseResponse<IncomingLink[]>>(
      `/documents/${documentId}/incoming-links`,
    );
    return data.value;
  };

  getImpact = async (documentId: string, depth = 3) => {
    const { data } = await authApi.get<BaseResponse<ImpactReport>>(
      `/documents/${documentId}/impact`,
      { params: { depth } },
    );
    return data.value;
  };

  search = async (projectId: string, params: SearchParams) => {
    const { data } = await authApi.get<BaseResponse<SearchResponse>>(
      `/projects/${projectId}/search`,
      {
        params: {
          q: params.q,
          docType: params.docType,
          mode: params.mode,
          limit: params.limit ?? 20,
        },
      },
    );
    return data.value;
  };

  // ── Thay trọn từng section (mỗi endpoint nhận cả mảng, thay hết nội dung cũ) ──────
  replaceListItems = async (
    documentId: string,
    itemType: number,
    items: { label?: string | null; content: string }[],
  ) => {
    await authApi.put<BaseResponse<DocumentDetail>>(
      `/documents/${documentId}/sections/${itemType}`,
      items,
    );
  };

  replaceFlows = async (
    documentId: string,
    flows: {
      flowType: number;
      code?: string | null;
      title?: string | null;
      steps: string[];
    }[],
  ) => {
    await authApi.put<BaseResponse<DocumentDetail>>(
      `/documents/${documentId}/flows`,
      flows,
    );
  };

  replaceAcceptanceCriteria = async (
    documentId: string,
    criteria: {
      code: string;
      givenText: string;
      whenText: string;
      thenText: string;
      andConditions: string[];
    }[],
  ) => {
    await authApi.put<BaseResponse<DocumentDetail>>(
      `/documents/${documentId}/acceptance-criteria`,
      criteria,
    );
  };

  replaceAssignees = async (
    documentId: string,
    assignees: { role: number; displayName: string; userId?: string | null }[],
  ) => {
    await authApi.put<BaseResponse<DocumentDetail>>(
      `/documents/${documentId}/assignees`,
      assignees,
    );
  };

  replaceLinks = async (
    documentId: string,
    links: {
      targetKind: number;
      targetDocKey: string;
      linkType: number;
      note?: string | null;
      targetSection?: string | null;
    }[],
  ) => {
    await authApi.put<BaseResponse<DocumentDetail>>(
      `/documents/${documentId}/links`,
      links,
    );
  };

  /**
   * Thay trọn section API — endpoint (kèm ví dụ) và error code đi cùng nhau vì cùng mô tả một
   * hợp đồng API, backend nhận chúng trong MỘT request (ApiSectionInput).
   */
  replaceApi = async (
    documentId: string,
    api: {
      endpoints: {
        scope: number; // ApiScope: Internal=1, External=2
        method?: number | null; // ApiHttpMethod: Get=1 … Options=7
        path?: string | null;
        name?: string | null;
        description?: string | null;
        examples: {
          title?: string | null;
          requestSample?: string | null;
          responseSample?: string | null;
          responseStatus?: number | null;
          errorSample?: string | null;
        }[];
      }[];
      errorCodes: {
        code: string;
        httpStatus?: number | null;
        description?: string | null;
      }[];
    },
  ) => {
    await authApi.put<BaseResponse<DocumentDetail>>(
      `/documents/${documentId}/api`,
      api,
    );
  };

  replaceDiagrams = async (
    documentId: string,
    diagrams: {
      diagramType: number;
      format: number;
      title?: string | null;
      description?: string | null;
      sourceCode?: string | null;
      externalUrl?: string | null;
    }[],
  ) => {
    await authApi.put<BaseResponse<DocumentDetail>>(
      `/documents/${documentId}/diagrams`,
      diagrams,
    );
  };
}

const documentService = new DocumentService();
export default documentService;
