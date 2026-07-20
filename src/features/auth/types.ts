export const Role = {
  User: "User",
  Mentor: "Mentor",
  Lecturer: "Lecturer",
  Admin: "Admin",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface Me {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatar: string | null;
  organizationId: string | null;
  slug: string;
  isEmailVerified: boolean;
}
