export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
  members: (id: string) => [...projectKeys.all, "members", id] as const,
  repositories: (id: string) =>
    [...projectKeys.all, "repositories", id] as const,
  publishJobs: (projectId: string) =>
    [...projectKeys.all, "publish-jobs", projectId] as const,
  projectGraph: (projectId: string) =>
    [...projectKeys.all, "graph", projectId] as const,
  linkIssues: (projectId: string, staleDays: number) =>
    [...projectKeys.all, "link-issues", projectId, staleDays] as const,
  errorCodes: (projectId: string) =>
    [...projectKeys.all, "error-codes", projectId] as const,
  // Tiền tố chung của MỌI danh sách tài liệu trong project — dùng cái này để invalidate.
  // Khoá đầy đủ còn có object tham số ở cuối, nên invalidate bằng documents(id) sẽ tạo khoá
  // [..., id, {}] và chỉ khớp danh sách KHÔNG tham số, bỏ sót mọi danh sách đang lọc.
  documentLists: (projectId: string) =>
    [...projectKeys.all, "documents", projectId] as const,
  documents: (id: string, params?: object) =>
    [...projectKeys.documentLists(id), params ?? {}] as const,
  // Danh sách cuộn vô hạn của thanh điều hướng — nằm dưới cùng tiền tố để invalidate một lần
  // là trúng cả hai. "infinite" đứng trước object tham số nên không đụng khoá documents().
  documentsInfinite: (projectId: string, params?: object) =>
    [...projectKeys.documentLists(projectId), "infinite", params ?? {}] as const,
  document: (documentId: string) =>
    [...projectKeys.all, "document", documentId] as const,
  documentGovernance: (documentId: string) =>
    [...projectKeys.all, "document", documentId, "governance"] as const,
  documentPreview: (documentId: string) =>
    [...projectKeys.all, "document", documentId, "preview"] as const,
  search: (projectId: string, params?: object) =>
    [...projectKeys.all, "search", projectId, params ?? {}] as const,
  incomingLinks: (documentId: string) =>
    [...projectKeys.all, "document", documentId, "incoming-links"] as const,
  impact: (documentId: string, depth: number) =>
    [...projectKeys.all, "document", documentId, "impact", depth] as const,
  versions: (documentId: string) =>
    [...projectKeys.all, "document", documentId, "versions"] as const,
  version: (documentId: string, versionNumber: number) =>
    [...projectKeys.all, "document", documentId, "version", versionNumber] as const,
  versionMarkdown: (documentId: string, versionNumber: number) =>
    [
      ...projectKeys.all,
      "document",
      documentId,
      "version",
      versionNumber,
      "markdown",
    ] as const,
  versionDiff: (documentId: string, from: number, to: number) =>
    [
      ...projectKeys.all,
      "document",
      documentId,
      "versions",
      "diff",
      from,
      to,
    ] as const,
};

export const ghKeys = {
  dir: (path: string) => ["gh", "dir", path] as const,
  file: (path: string) => ["gh", "file", path] as const,
  historyAll: () => ["gh", "history", ""] as const,
  historyPath: (path: string) => ["gh", "history", path] as const,
  storiesAll: () => ["gh", "stories", "all"] as const,
  tddsAll: () => ["gh", "tdds", "all"] as const,
  rulesAll: () => ["gh", "rules", "all"] as const,
};

export const GH_STALE = 30_000;

// Dữ liệu project/tài liệu từ backend: coi là còn tươi trong 30s để đi lại giữa chi tiết ↔
// sửa ↔ lịch sử phiên bản không fetch lại toàn bộ ở mỗi lần mount. Mutation vẫn invalidate
// tường minh nên thay đổi vẫn hiện ra ngay.
export const PROJECT_STALE = 30_000;
