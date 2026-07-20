import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import authConfig from "./config";

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
    await axios.post(
      `${authConfig.baseURL}/api/v1/users/refresh_token`,
      {},
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      },
    );
    return true;
  } catch (err) {
    const error = err as AxiosError<ErrorResponse>;
    if (error.response?.data?.messageCode === "InvalidRefreshToken") {
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
    baseURL: `${baseURL}/api`,
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

      const isExpiredAccessToken =
        status === 401 &&
        (messageCode === "ExpiredAccessToken" ||
          messageCode === "MissingAccessToken");
      const isRefreshRequest = originalRequest.url?.includes(
        "/users/refresh_token",
      );

      if (!originalRequest || !isExpiredAccessToken || isRefreshRequest) {
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
