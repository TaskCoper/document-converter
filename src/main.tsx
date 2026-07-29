import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { UpdateBanner } from "./components/update-banner";
import { useReposStore } from "./features/repos/store";
import { applyUpdate, isUpdatePending, startVersionWatch } from "./lib/app-version";
import { router } from "./router";

import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Drop all GitHub-backed queries when the active repo changes — every cached
// listing/file/history belongs to the previous repo and would produce wrong UI
// or wrong writes if reused against a different repo.
useReposStore.subscribe((state, prev) => {
  if (state.activeRepoId !== prev.activeRepoId) {
    queryClient.removeQueries({ queryKey: ["gh"] });
  }
});

startVersionWatch();

// Khi đã có bản deploy mới nhưng người dùng chưa bấm "Tải lại": chờ tới lần chuyển
// route kế tiếp rồi mới nạp lại cả trang. Đổi route là lúc an toàn nhất — không cắt
// ngang lúc đang gõ form — và cũng là lúc bundle cũ sắp phải tải một lazy chunk đã bị
// xoá khỏi CDN.
let lastLocationKey = router.state.location.key;
router.subscribe((state) => {
  if (state.location.key === lastLocationKey) return;
  lastLocationKey = state.location.key;
  if (isUpdatePending()) applyUpdate();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <UpdateBanner />
    </QueryClientProvider>
  </StrictMode>,
);
