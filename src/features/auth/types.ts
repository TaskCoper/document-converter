export const Role = {
  User: "User",
  Mentor: "Mentor",
  Lecturer: "Lecturer",
  Admin: "Admin",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

// Hình dạng UserProfile trả về từ backend document-first-be (/auth/me, /auth/register,
// và trường `user` trong /auth/login). Xem AuthService/IService.cs: record UserProfile.
export interface Me {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

// Body của /auth/login: access token nằm trong body, refresh token CHỈ nằm trong
// cookie httpOnly (không trả về đây). refreshTokenExpiresAt để client biết hạn phiên.
export interface LoginResult {
  accessToken: string;
  refreshTokenExpiresAt: string;
  user: Me;
}
