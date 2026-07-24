import { ProjectRole } from "./types";

// Phản chiếu ProjectRoleExtensions.Covers ở backend: số NHỎ hơn = quyền LỚN hơn,
// nên "đủ quyền" là actual <= required. KHÔNG viết actual >= required (Viewer sẽ thành Owner).
export const covers = (actual: ProjectRole, required: ProjectRole): boolean =>
  actual <= required;

// Các cổng quyền, khớp 1-1 với [Authorize(Policy = ...)] trên ProjectController.
export const canViewProject = (role: ProjectRole) =>
  covers(role, ProjectRole.Viewer); // mọi thành viên
export const canEditProject = (role: ProjectRole) =>
  covers(role, ProjectRole.Admin); // PUT /projects/{id}
export const canManageMembers = (role: ProjectRole) =>
  covers(role, ProjectRole.Admin); // add / change-role / remove member
export const canDeleteProject = (role: ProjectRole) =>
  covers(role, ProjectRole.Owner); // DELETE /projects/{id} — chỉ Owner
export const canManageRepositories = (role: ProjectRole) =>
  covers(role, ProjectRole.Admin); // cả LIST repo cũng yêu cầu Admin+
export const canEditDocuments = (role: ProjectRole) =>
  covers(role, ProjectRole.Editor); // tạo/sửa tài liệu — Editor+
export const canDeleteDocuments = (role: ProjectRole) =>
  covers(role, ProjectRole.Admin); // xoá tài liệu — Admin+
export const canReleaseDocuments = (role: ProjectRole) =>
  covers(role, ProjectRole.Admin); // phát hành — Admin+ (Editor không được release)
