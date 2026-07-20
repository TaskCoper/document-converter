export type GhErrorKind =
  | "CONFLICT"
  | "NOT_FOUND"
  | "RATE_LIMIT"
  | "UNAUTHORIZED"
  | "VALIDATION"
  | "NETWORK"
  | "OTHER";

export class GhError extends Error {
  kind: GhErrorKind;
  status?: number;
  detail?: string;
  constructor(kind: GhErrorKind, status?: number, detail?: string) {
    super(
      `${kind}${status ? ` (${status})` : ""}${detail ? `: ${detail}` : ""}`,
    );
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
}

export function messageFor(err: unknown): string {
  if (!(err instanceof GhError)) return "Có lỗi xảy ra. Vui lòng thử lại.";
  switch (err.kind) {
    case "UNAUTHORIZED":
      return "Token GitHub không hợp lệ hoặc đã hết hạn.";
    case "RATE_LIMIT":
      return "Đã vượt giới hạn API của GitHub. Thử lại sau ít phút.";
    case "NOT_FOUND":
      return "Không tìm thấy file hoặc thư mục.";
    case "CONFLICT":
      return err.detail
        ? `Xung đột khi ghi lên GitHub: ${err.detail}`
        : "Có người vừa chỉnh sửa file này. Vui lòng tải lại rồi thử lại.";
    case "VALIDATION":
      return `Yêu cầu không hợp lệ${err.detail ? `: ${err.detail}` : ""}.`;
    case "NETWORK":
      return "Không kết nối được đến GitHub. Kiểm tra mạng và thử lại.";
    default:
      return err.detail || "Có lỗi xảy ra khi gọi GitHub.";
  }
}
