import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";

import { Spinner } from "@/components/ui/spinner";
import RootLayout from "@/layout";

const BrowsePage = lazy(() => import("@/pages/browse.page"));
const FilesPage = lazy(() => import("@/pages/files.page"));
const HistoryPage = lazy(() => import("@/pages/history.page"));
const NotFoundPage = lazy(() => import("@/pages/not-found.page"));
const RulePage = lazy(() => import("@/pages/rule.page"));
const StoriesPage = lazy(() => import("@/pages/stories.page"));
const TddPage = lazy(() => import("@/pages/tdd.page"));
const ViewPage = lazy(() => import("@/pages/view.page"));

function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Spinner />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <LazyRoute><BrowsePage /></LazyRoute> },
      { path: "browse/*", element: <LazyRoute><BrowsePage /></LazyRoute> },
      { path: "file/*", element: <LazyRoute><FilesPage /></LazyRoute> },
      { path: "view/*", element: <LazyRoute><ViewPage /></LazyRoute> },
      { path: "history", element: <LazyRoute><HistoryPage /></LazyRoute> },
      { path: "stories", element: <LazyRoute><StoriesPage key="create" /></LazyRoute> },
      { path: "edit/*", element: <LazyRoute><StoriesPage key="edit" /></LazyRoute> },
      { path: "tdd", element: <LazyRoute><TddPage key="tdd-create" /></LazyRoute> },
      { path: "edit-tdd/*", element: <LazyRoute><TddPage key="tdd-edit" /></LazyRoute> },
      { path: "rules", element: <LazyRoute><RulePage key="rule-create" /></LazyRoute> },
      { path: "edit-rule/*", element: <LazyRoute><RulePage key="rule-edit" /></LazyRoute> },
      { path: "*", element: <LazyRoute><NotFoundPage /></LazyRoute> },
    ],
  },
]);
