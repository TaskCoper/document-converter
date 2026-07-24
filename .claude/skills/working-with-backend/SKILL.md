---
name: working-with-backend
description: Bắt buộc dùng khi thêm/sửa bất kỳ lời gọi nào từ document-converter tới backend — đăng nhập, đăng xuất, /me, refresh token, hay endpoint auth mới. Backend CHỈ phục vụ auth (JWT + refresh cookie); tài liệu KHÔNG đi qua backend mà ghi thẳng lên GitHub. Dùng khi user nói "gọi API", "thêm endpoint", "sửa đăng nhập", "kết nối backend", "lấy thông tin user".
---

# Tương tác với Backend từ VNZ Converter

## Điều quan trọng nhất: backend chỉ lo AUTH

Frontend này **không** có backend cho tài liệu. Document (User Story / TDD / Rule) ghi thẳng
lên GitHub qua [src/lib/github/](../../../src/lib/github/). Backend (`VITE_AUTH_API_BASE_URL`)
chỉ dùng cho **xác thực người dùng**: đăng nhập, đăng xuất, `/me`, refresh token.

→ Cần đọc/ghi tài liệu: KHÔNG gọi backend, dùng GitHub client + hook trong `src/hooks/`.
→ Cần thông tin/quyền người dùng, phiên đăng nhập: mới dùng backend (mục dưới).

## Hai axios client — đừng nhầm

| Client | Dùng cho | withCredentials | Base URL |
|---|---|---|---|
| [src/lib/github/](../../../src/lib/github/) | Tài liệu (GitHub API) | không | `api.github.com` |
| [src/lib/auth/api.ts](../../../src/lib/auth/api.ts) | Auth (backend) | **có** (cookie) | `${VITE_AUTH_API_BASE_URL}/api` |

Chỉ `authApi` mới nói chuyện với backend. Đừng import nhầm client cho sai mục đích.

## Contract của auth client (đọc trước khi thêm call)

Xem [src/lib/auth/api.ts](../../../src/lib/auth/api.ts):

- **`withCredentials: true`** — cookie đi kèm mọi request. Refresh token là cookie httpOnly do
  backend đặt; frontend không đọc được nó.
- Request interceptor chỉ thêm `Accept-Language: en` và `X-Timezone`. **Không đính kèm header
  `Authorization: Bearer`.** `accessToken` lưu trong store chỉ để **decode phía client** lấy
  thông tin user/role, không gửi lên như bearer.
- **Vỏ response chuẩn** — mọi call bọc trong `BaseResponse<T>`:
  `{ isSuccess, isFailure, error: { code, message }, value: T }`. Dữ liệu thật nằm ở `.value`.
- **Vỏ lỗi** `ErrorResponse`: `{ title, status, detail, messageCode, errors }`. Bắt lỗi bằng
  `AxiosError<ErrorResponse>` và phân nhánh theo **`messageCode`**, không dựa vào chuỗi `detail`
  (nhưng `detail` viết bằng tiếng Việt và có thể hiện thẳng cho user — xem `use-sign-in.ts`).

## Cơ chế refresh token (đừng phá)

Interceptor response trong [api.ts](../../../src/lib/auth/api.ts) tự xử lý:

- Gặp `401` với `messageCode` là `ExpiredAccessToken` hoặc `MissingAccessToken` → tự gọi
  `refresh_token` **một lần** rồi phát lại request gốc (có `_retry` chống lặp).
- Nhiều request 401 cùng lúc → xếp hàng qua `refreshSubscribers`, chỉ refresh một lần.
- Refresh thất bại với `InvalidRefreshToken` → redirect `/sign-in` (trừ khi đang ở route công
  khai `/` hoặc `/sign-in`).

Thêm endpoint mới thì để nguyên cơ chế này lo — chỉ cần gọi qua `authApi`, đừng tự bắt 401.

## Thêm một lời gọi backend mới — theo đúng pattern

1. **Khai báo hàm gọi** trong [src/features/auth/services.ts](../../../src/features/auth/services.ts)
   (class `UserService`), dùng `authApi`, kiểu trả về bọc `BaseResponse<T>`, trả `data.value`:
   ```ts
   getSomething = async () => {
     const { data } = await authApi.get<BaseResponse<Something>>(`/v1/users/xxx`);
     return data.value;
   };
   ```
   (Lưu ý `authApi` đã có prefix `/api`, nên path bắt đầu từ `/v1/...`.)
2. **Bọc trong hook React Query** ở `src/features/auth/hooks/`. Query dùng key từ
   [src/lib/query-keys.ts](../../../src/lib/query-keys.ts) (`authKeys`); mutation dùng
   `useMutation` + cập nhật `useAuthStore`, và `queryClient` khi cần. Mẫu:
   [use-sign-in.ts](../../../src/features/auth/hooks/use-sign-in.ts),
   [use-get-me.ts](../../../src/features/auth/hooks/use-get-me.ts),
   [use-sign-out.ts](../../../src/features/auth/hooks/use-sign-out.ts).
3. **Trạng thái auth** đọc/ghi qua [store.ts](../../../src/features/auth/store.ts)
   (`useAuthStore`). JWT decode phía client cho ra `UserPayload` (`Role`, `UserId`,
   `OrganizationId`, `IsVerified`, `Email`). Chỉ `accessToken`/`refreshToken` được persist vào
   localStorage; rehydrate sẽ decode lại.

## Bypass bằng fake token (dev cục bộ)

Không có backend vẫn chạy được nhờ [fake.ts](../../../src/features/auth/fake.ts):

- `fakeSignIn()` tạo JWT không ký hợp lệ về cú pháp, đuôi là marker `.fake-signature`.
- `isFakeToken()` / `state.isFake` nhận diện token này. **Mọi call mạng phải tự bỏ qua khi
  đang fake hoặc chưa cấu hình backend** — xem `enabled` trong
  [use-get-me.ts](../../../src/features/auth/hooks/use-get-me.ts):
  `enabled && hasToken && !isFake && hasAuthBackend`. Hook mới gọi backend phải copy điều kiện
  guard này, nếu không sẽ bắn request rác trong dev.

## ⚠️ Kiểm tra khớp path trước khi tin

Frontend gọi các path kiểu `/api/v1/users/login`, `/api/v1/users/refresh_token`, `/v1/users/me`,
`/v1/users/logout`. Backend `document-first-be` trong workspace này lại đặt route ở
`/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` (`AuthController`, `[Route("auth")]`),
với vỏ response khác. Hai bên **dùng chung bộ `messageCode`** (`ExpiredAccessToken`,
`MissingAccessToken`, `InvalidRefreshToken`) nhưng **đường dẫn và shape không trùng** — rất có
thể `VITE_AUTH_API_BASE_URL` trỏ tới một auth service riêng, không phải `document-first-be`.

→ Trước khi wiring hay debug auth: **xác minh `VITE_AUTH_API_BASE_URL` thực sự trỏ đâu** và path
mới có tồn tại ở service đó không. Đừng suy ra endpoint từ code `document-first-be` rồi cho là
frontend gọi trúng.

## Checklist

- [ ] Đúng mục đích: tài liệu → GitHub, chỉ auth mới → backend.
- [ ] Dùng `authApi` (không phải github client), path bắt đầu `/v1/...`.
- [ ] Kiểu trả về bọc `BaseResponse<T>`, lấy `.value`.
- [ ] Lỗi phân nhánh theo `messageCode` (`AxiosError<ErrorResponse>`).
- [ ] Không tự xử lý 401/refresh — để interceptor lo.
- [ ] Hook đặt trong `features/auth/hooks/`, key từ `authKeys`.
- [ ] Có guard `!isFake && hasAuthBackend` cho call mạng.
- [ ] Đã xác minh path khớp service mà `VITE_AUTH_API_BASE_URL` trỏ tới.
