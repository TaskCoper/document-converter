import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { useReposStore } from "./features/repos/store";
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
