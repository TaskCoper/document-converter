// Vai trò trong project. Backend serialize enum thành SỐ (không có JsonStringEnumConverter),
// và số NHỎ hơn = quyền LỚN hơn (Owner=1 … Viewer=4). Xem ProjectRole ở backend
// (document_first.Repo/Enums/CollaborationEnums.cs) và permissions.ts.
export const ProjectRole = {
  Owner: 1,
  Admin: 2,
  Editor: 3,
  Viewer: 4,
} as const;

export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];

export const ProjectRoleLabel: Record<ProjectRole, string> = {
  [ProjectRole.Owner]: "Chủ sở hữu",
  [ProjectRole.Admin]: "Quản trị",
  [ProjectRole.Editor]: "Biên tập",
  [ProjectRole.Viewer]: "Người xem",
};

// Mô tả ngắn cho từng vai trò — dùng trong dropdown chọn quyền khi assign thành viên.
export const ProjectRoleDescription: Record<ProjectRole, string> = {
  [ProjectRole.Owner]: "Toàn quyền, kể cả xoá dự án và quản lý Owner.",
  [ProjectRole.Admin]: "Sửa dự án và quản lý thành viên.",
  [ProjectRole.Editor]: "Chỉnh sửa tài liệu trong dự án.",
  [ProjectRole.Viewer]: "Chỉ xem.",
};

// Thứ tự hiển thị trong select (mạnh → yếu).
export const PROJECT_ROLE_ORDER: ProjectRole[] = [
  ProjectRole.Owner,
  ProjectRole.Admin,
  ProjectRole.Editor,
  ProjectRole.Viewer,
];

export interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  myRole: ProjectRole;
  memberCount: number;
}

export interface ProjectDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
  memberCount: number;
  documentCount: number;
}

export interface MemberInfo {
  userId: string;
  email: string;
  fullName: string;
  role: ProjectRole;
  joinedAt: string;
}
