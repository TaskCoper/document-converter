const authConfig = {
  baseURL: (import.meta.env.VITE_AUTH_API_BASE_URL as string) ?? "",
} as const;

export default authConfig;
