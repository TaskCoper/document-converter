import { jwtDecode, type JwtPayload } from "jwt-decode";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const AUTH_STORAGE_KEY = "auth";

export interface UserPayload extends JwtPayload {
  Role: string;
  UserId: string;
  OrganizationId: string;
  IsVerified: string;
  Email: string;
}

// Marker suffix baked into locally-minted tokens (see features/auth/fake.ts).
// If a stored token ends with this, we know there is no real backend session
// behind it, so we skip network calls like /me.
export const FAKE_TOKEN_MARKER = ".fake-signature";

export const isFakeToken = (token: string | null | undefined): boolean =>
  !!token && token.endsWith(FAKE_TOKEN_MARKER);

// Backend document-first-be phát access token với claim CHUẨN của .NET
// (ClaimTypes.*), không phải các tên custom (Email/UserId/...) mà store này đọc.
// Chuẩn hoá cả hai: fake token dùng tên custom, token thật dùng URI ClaimTypes.
const NAMEID_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
const EMAIL_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
const ROLE_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role";

const decodeUser = (token: string): UserPayload => {
  const raw = jwtDecode<JwtPayload & Record<string, unknown>>(token);
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  return {
    ...raw,
    Email: str(raw.Email) ?? str(raw[EMAIL_CLAIM]) ?? "",
    UserId: str(raw.UserId) ?? str(raw[NAMEID_CLAIM]) ?? str(raw.sub) ?? "",
    OrganizationId: str(raw.OrganizationId) ?? "",
    Role: str(raw.Role) ?? str(raw[ROLE_CLAIM]) ?? "User",
    // Token thật không mang trạng thái xác thực; coi như đã xác thực và để /me
    // (isEmailVerified) là nguồn sự thật, tránh cờ "chưa xác thực" giả.
    IsVerified: str(raw.IsVerified) ?? "true",
  };
};

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: UserPayload | null;
  isVerificationRequired: boolean;
  isFake: boolean;
  setVerificationRequired: (required: boolean) => void;
  signIn: (accessToken: string, refreshToken?: string | null) => void;
  signOut: () => void;
  updateTokens: (tokens: {
    accessToken: string;
    refreshToken?: string;
  }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
      isVerificationRequired: false,
      isFake: false,
      setVerificationRequired: (required: boolean) =>
        set({ isVerificationRequired: required }),
      signIn: (accessToken: string, refreshToken?: string | null) => {
        const user = decodeUser(accessToken);
        const isVerified = user.IsVerified === "true";

        set({
          isAuthenticated: true,
          accessToken,
          refreshToken: refreshToken ?? null,
          user,
          isVerificationRequired: !isVerified,
          isFake: isFakeToken(accessToken),
        });
      },
      signOut: () => {
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          user: null,
          isVerificationRequired: false,
          isFake: false,
        });
      },
      updateTokens: ({ accessToken, refreshToken }) =>
        set((state) => {
          const user = decodeUser(accessToken);
          return {
            accessToken,
            refreshToken: refreshToken ?? state.refreshToken,
            user,
            isAuthenticated: true,
            isFake: isFakeToken(accessToken),
          };
        }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          try {
            const user = decodeUser(state.accessToken);
            state.user = user;
            state.isAuthenticated = true;
            state.isVerificationRequired = user.IsVerified === "false";
            state.isFake = isFakeToken(state.accessToken);
          } catch {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isAuthenticated = false;
            state.isVerificationRequired = false;
            state.isFake = false;
          }
        }
      },
    },
  ),
);
