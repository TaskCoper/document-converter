import { useSyncExternalStore } from "react";

/**
 * Phát hiện bản deploy mới trên production.
 *
 * SPA đã tải xong thì không bao giờ tự lấy lại index.html, nên một tab mở từ hôm
 * trước vẫn chạy bundle cũ vô thời hạn — và các lazy chunk của bản cũ đã bị xoá khỏi
 * CDN nên chuyển route là lỗi. Module này poll `/version.json` (do plugin
 * `vnz-version-manifest` sinh ra lúc build) và so với `__BUILD_ID__` đã nhúng trong
 * bundle đang chạy; khác nhau nghĩa là đã có bản mới.
 */

const VERSION_URL = "/version.json";
const POLL_MS = 60_000;
// Chặn vòng lặp reload: nếu vừa reload xong mà chunk vẫn lỗi thì thôi, để lỗi nổi lên
// thay vì quay vòng vô hạn.
const RELOAD_GUARD_KEY = "vnz-reload-guard";
const RELOAD_GUARD_MS = 10_000;

let pending = false;
const listeners = new Set<() => void>();

function markPending() {
  if (pending) return;
  pending = true;
  for (const listener of listeners) listener();
}

export function isUpdatePending() {
  return pending;
}

/** Tải lại trang để chạy bản mới. Có chặn reload lặp. */
export function applyUpdate() {
  const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0);
  if (Date.now() - last < RELOAD_GUARD_MS) return;
  sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  window.location.reload();
}

/** Đăng ký React vào trạng thái "đã có bản mới". */
export function useUpdatePending() {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => pending,
    () => false,
  );
}

async function checkVersion() {
  if (pending) return;
  try {
    // `?t=` cho các proxy bỏ qua Cache-Control, `no-store` cho cache của trình duyệt.
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data: unknown = await res.json();
    const buildId = (data as { buildId?: unknown }).buildId;
    if (typeof buildId === "string" && buildId !== __BUILD_ID__) markPending();
  } catch {
    // Mất mạng hoặc CDN chớp — bỏ qua, lần poll sau sẽ thử lại.
  }
}

/**
 * Bắt đầu theo dõi. Chỉ chạy ở bản build production — dev server không có
 * `/version.json`, và HMR đã lo việc cập nhật rồi.
 */
export function startVersionWatch() {
  if (!import.meta.env.PROD) return;

  // Chunk của bản cũ đã biến mất khỏi CDN: không chờ được nữa, nạp lại ngay.
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    applyUpdate();
  });

  const timer = window.setInterval(() => {
    if (pending) {
      window.clearInterval(timer);
      return;
    }
    void checkVersion();
  }, POLL_MS);

  // Quay lại tab sau một lúc là thời điểm dễ có bản mới nhất — kiểm tra luôn.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void checkVersion();
  });

  void checkVersion();
}
