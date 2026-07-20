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

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: UserPayload | null;
  isVerificationRequired: boolean;
  isFake: boolean;
  setVerificationRequired: (required: boolean) => void;
  signIn: (accessToken: string, refreshToken: string) => void;
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
      signIn: (accessToken: string, refreshToken: string) => {
        const user = jwtDecode<UserPayload>(accessToken);
        const isVerified = user.IsVerified === "true";

        set({
          isAuthenticated: true,
          accessToken,
          refreshToken,
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
          const user = jwtDecode<UserPayload>(accessToken);
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
            const user = jwtDecode<UserPayload>(state.accessToken);
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
