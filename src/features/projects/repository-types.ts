// Cấu hình repo GitHub đích của một project. KHÔNG bao giờ chứa token (kể cả đã mã hoá);
// chỉ có cờ hasToken. Xem GitHubService/IService.cs: record RepositoryInfo.
export interface RepositoryInfo {
  id: string;
  owner: string;
  name: string;
  defaultBranch: string;
  basePath: string;
  isActive: boolean;
  hasToken: boolean;
  createdAt: string;
}

// Kết quả gọi thử GitHub bằng token đang lưu.
export interface ConnectionTest {
  ok: boolean;
  message: string;
  rateLimitRemaining: number | null;
}

// Hàng đợi publish lên GitHub — xem PublishController/PublishJob ở backend. Job được tạo khi
// phát hành tài liệu (1 job/kho GitHub active), xử lý bởi worker định kỳ phía backend (không có
// webhook/SignalR đẩy về client — frontend phải tự poll).
export const PublishStatus = {
  Pending: 1,
  Running: 2,
  Succeeded: 3,
  Failed: 4,
  Cancelled: 5,
} as const;
export type PublishStatus = (typeof PublishStatus)[keyof typeof PublishStatus];

export const PublishStatusLabel: Record<PublishStatus, string> = {
  [PublishStatus.Pending]: "Chờ xử lý",
  [PublishStatus.Running]: "Đang chạy",
  [PublishStatus.Succeeded]: "Đã publish",
  [PublishStatus.Failed]: "Lỗi",
  [PublishStatus.Cancelled]: "Đã huỷ",
};

export interface PublishJobRow {
  jobId: string;
  docKey: string;
  versionNumber: number;
  versionLabel: string | null;
  repositoryFullName: string;
  filePath: string;
  status: PublishStatus;
  commitSha: string | null;
  attemptCount: number;
  lastError: string | null;
  nextAttemptAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

// Kết quả 1 lần chạy /publish-jobs/run — LƯU Ý: xử lý hàng đợi TOÀN HỆ THỐNG, không giới hạn
// theo project (route có projectId nhưng backend không dùng để lọc).
export interface PublishCycleResult {
  claimed: number;
  published: number;
  skippedIdentical: number;
  deferred: number;
  failed: number;
  errors: string[];
}
