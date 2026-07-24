import { useAuthStore } from "@/features/auth/store";
import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import authConfig from "./config";

// messageCode của backend document-first-be dùng SCREAMING_SNAKE_CASE (không phải
// PascalCase). Đây là các mã 401 nghĩa là "access token không dùng được nữa nhưng
// refresh token có thể vẫn còn" → thử refresh. Lưu ý: khi access cookie (15 phút) hết
// hạn, trình duyệt XOÁ nó, nên request sau không có token và backend trả UNAUTHENTICATED
// (chứ không phải EXPIRED_ACCESS_TOKEN) — phải xử lý cả mã này thì refresh mới chạy.
const AUTH_REFRESH_TRIGGER_CODES = new Set([
  "EXPIRED_ACCESS_TOKEN",
  "MISSING_ACCESS_TOKEN",
  "UNAUTHENTICATED",
]);

interface ApiResponse {
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    message: string;
  };
}

export interface BaseResponse<T> extends ApiResponse {
  value: T;
}

export interface BasePaginationResponse<T> extends ApiResponse {
  value: {
    items: T[];
    pageIndex: number;
    pageSize: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ErrorResponse {
  title: string;
  status: number;
  detail: string;
  messageCode: string;
  errors: Record<string, unknown>[] | null;
}

const PUBLIC_ROUTE_PATHS = new Set(["/", "/sign-in"]);

const normalizePathname = (pathname: string) => {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
};

const isPublicRoutePath = (pathname: string) =>
  PUBLIC_ROUTE_PATHS.has(normalizePathname(pathname));

const refreshAccessToken = async (): Promise<boolean> => {
  try {
    // Refresh token sống trong cookie httpOnly (X-Refresh-Token) do backend đặt;
    // gửi body rỗng, backend tự đọc cookie. withCredentials để cookie đi kèm.
    await axios.post(
      `${authConfig.baseURL}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      },
    );
    return true;
  } catch (err) {
    const error = err as AxiosError<ErrorResponse>;
    // Refresh trả 401 (INVALID_REFRESH_TOKEN / EXPIRED_REFRESH_TOKEN…) → phiên chết hẳn.
    // Phải XOÁ trạng thái cục bộ: nếu không, localStorage vẫn còn access token cũ khiến
    // AuthGuard tưởng đã đăng nhập và lặp vô hạn giữa "/" và "/sign-in". Lỗi mạng
    // (không có response) thì coi là tạm thời, không đăng xuất.
    if (error.response?.status === 401) {
      useAuthStore.getState().signOut();
      if (!isPublicRoutePath(window.location.pathname)) {
        window.location.replace("/sign-in");
      }
    }
    return false;
  }
};

let isRefreshing = false;
let refreshSubscribers: ((error: AxiosError | null) => void)[] = [];

const subscribeTokenRefresh = (cb: (error: AxiosError | null) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (error: AxiosError | null = null) => {
  refreshSubscribers.forEach((cb) => cb(error));
  refreshSubscribers = [];
};

export const createApiClient = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    // Backend (document-first-be) đặt route ngay ở gốc: /auth/login, /auth/me...
    // — không có tiền tố /api. Đường dẫn trong services bắt đầu bằng /auth/.
    baseURL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    paramsSerializer: (params) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (Array.isArray(value)) {
          value.forEach((item) => searchParams.append(key, item));
        } else {
          searchParams.append(key, String(value));
        }
      });
      return searchParams.toString();
    },
  });

  instance.interceptors.request.use((config) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    config.headers["Accept-Language"] = "en";
    config.headers["X-Timezone"] = timezone;
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };
      const status = error.response?.status;
      const messageCode = (error.response?.data as ErrorResponse)?.messageCode;

      // Chỉ refresh cho các mã "hết phiên access". KHÔNG refresh cho INVALID_CREDENTIALS
      // (401 lúc đăng nhập sai mật khẩu) — sẽ redirect nhầm khỏi trang đăng nhập.
      const isAuthExpired =
        status === 401 &&
        messageCode !== undefined &&
        AUTH_REFRESH_TRIGGER_CODES.has(messageCode);
      const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");

      if (!originalRequest || !isAuthExpired || isRefreshRequest) {
        return Promise.reject(error);
      }

      if (originalRequest._retry) return Promise.reject(error);
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((err) => {
            if (err) return reject(err);
            resolve(instance(originalRequest));
          });
        });
      }

      isRefreshing = true;
      const isRefreshSuccessful = await refreshAccessToken();
      isRefreshing = false;

      if (!isRefreshSuccessful) {
        onRefreshed(error);
        return Promise.reject(error);
      }

      onRefreshed(null);
      return instance(originalRequest);
    },
  );

  return instance;
};

export const authApi = createApiClient(authConfig.baseURL);

export default authApi;
