import { useAuthStore } from "./store";

// Base64url encode a UTF-8 string (browser-safe).
const base64UrlEncode = (input: string): string => {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

// Build a syntactically-valid (unsigned) JWT the auth store can decode. The
// backend never sees this — it exists only to satisfy jwtDecode in local dev.
export const createFakeToken = (
  overrides: Partial<{
    Role: string;
    UserId: string;
    OrganizationId: string;
    IsVerified: string;
    Email: string;
    firstName: string;
    lastName: string;
  }> = {},
): string => {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({
      Role: overrides.Role ?? "User",
      UserId: overrides.UserId ?? "fake-user-id",
      OrganizationId: overrides.OrganizationId ?? "",
      IsVerified: overrides.IsVerified ?? "true",
      Email: overrides.Email ?? "fake@vnz.local",
      iat: now,
      exp: now + 60 * 60 * 24 * 365, // 1 year
    }),
  );
  return `${header}.${payload}.fake-signature`;
};

export const fakeSignIn = () => {
  const token = createFakeToken();
  useAuthStore.getState().signIn(token, "fake-refresh-token");
};
