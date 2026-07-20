import authConfig from "@/lib/auth/config";
import { authKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import userService from "../services";
import { useAuthStore } from "../store";

interface UseGetMeOptions {
  enabled?: boolean;
}

// True only when there's actually a remote auth server to talk to. Without it,
// /me would just spam whatever the dev server returns.
const hasAuthBackend = !!authConfig.baseURL;

export const useGetMe = ({ enabled = true }: UseGetMeOptions = {}) => {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const isFake = useAuthStore((s) => s.isFake);

  const {
    data: me,
    isLoading: isGettingMe,
    isError,
  } = useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      try {
        return await userService.getMe();
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    throwOnError: false,
    // Skip when: caller disabled it, no token, using a fake token, or no
    // backend configured. Any of these would produce a wasted request.
    enabled: enabled && hasToken && !isFake && hasAuthBackend,
  });

  return {
    me,
    isGettingMe,
    isAuthenticated: !!me && !isError,
    isVerificationRequired: !!me && me.isEmailVerified === false,
  };
};
