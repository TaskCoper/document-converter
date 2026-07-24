import { useAuthStore } from "@/features/auth/store";
import { useMembers } from "./use-members";

// Vai trò của người đang đăng nhập trong project, suy ra từ danh sách thành viên
// (khớp userId). Dùng để gate nút tạo/sửa/xoá tài liệu.
export const useMyProjectRole = (projectId: string | undefined) => {
  const currentUserId = useAuthStore((s) => s.user?.UserId);
  const { members } = useMembers(projectId);
  return members.find((m) => m.userId === currentUserId)?.role;
};
