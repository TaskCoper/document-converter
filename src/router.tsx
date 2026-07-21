/* eslint-disable react-refresh/only-export-components */
import { Spinner } from "@/components/ui/spinner";
import AuthGuardLayout from "@/layouts/auth-guard.layout";
import DefaultLayout from "@/layouts/default.layout";
import GuestLayout from "@/layouts/guest.layout";
import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";

const BrowsePage = lazy(() => import("@/pages/browse.page"));
const FilesPage = lazy(() => import("@/pages/files.page"));
const HistoryPage = lazy(() => import("@/pages/history.page"));
const NotFoundPage = lazy(() => import("@/pages/not-found.page"));
const ProfilePage = lazy(() => import("@/pages/profile.page"));
const ReposPage = lazy(() => import("@/pages/repos.page"));
const RulePage = lazy(() => import("@/pages/rule.page"));
const SignInPage = lazy(() => import("@/pages/sign-in.page"));
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
    element: <AuthGuardLayout requiresAuth={false} />,
    children: [
      {
        element: <GuestLayout />,
        children: [
          {
            path: "sign-in",
            element: (
              <LazyRoute>
                <SignInPage />
              </LazyRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "/",
    element: <AuthGuardLayout requiresAuth={true} />,
    children: [
      {
        element: <DefaultLayout />,
        children: [
          {
            index: true,
            element: (
              <LazyRoute>
                <ReposPage />
              </LazyRoute>
            ),
          },
          {
            path: "browse/*",
            element: (
              <LazyRoute>
                <BrowsePage />
              </LazyRoute>
            ),
          },
          {
            path: "file/*",
            element: (
              <LazyRoute>
                <FilesPage />
              </LazyRoute>
            ),
          },
          {
            path: "view/*",
            element: (
              <LazyRoute>
                <ViewPage />
              </LazyRoute>
            ),
          },
          {
            path: "history",
            element: (
              <LazyRoute>
                <HistoryPage />
              </LazyRoute>
            ),
          },
          {
            path: "stories",
            element: (
              <LazyRoute>
                <StoriesPage key="create" />
              </LazyRoute>
            ),
          },
          {
            path: "edit/*",
            element: (
              <LazyRoute>
                <StoriesPage key="edit" />
              </LazyRoute>
            ),
          },
          {
            path: "tdd",
            element: (
              <LazyRoute>
                <TddPage key="tdd-create" />
              </LazyRoute>
            ),
          },
          {
            path: "edit-tdd/*",
            element: (
              <LazyRoute>
                <TddPage key="tdd-edit" />
              </LazyRoute>
            ),
          },
          {
            path: "profile",
            element: (
              <LazyRoute>
                <ProfilePage />
              </LazyRoute>
            ),
          },
          {
            path: "rules",
            element: (
              <LazyRoute>
                <RulePage key="rule-create" />
              </LazyRoute>
            ),
          },
          {
            path: "edit-rule/*",
            element: (
              <LazyRoute>
                <RulePage key="rule-edit" />
              </LazyRoute>
            ),
          },
          {
            path: "*",
            element: (
              <LazyRoute>
                <NotFoundPage />
              </LazyRoute>
            ),
          },
        ],
      },
    ],
  },
]);
