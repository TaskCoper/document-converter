/* eslint-disable react-refresh/only-export-components */
import { Spinner } from "@/components/ui/spinner";
import AuthGuardLayout from "@/layouts/auth-guard.layout";
import DefaultLayout from "@/layouts/default.layout";
import GuestLayout from "@/layouts/guest.layout";
import { Suspense, lazy } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";

const BrowsePage = lazy(() => import("@/pages/browse.page"));
const FilesPage = lazy(() => import("@/pages/files.page"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password.page"));
const HistoryPage = lazy(() => import("@/pages/history.page"));
const NotFoundPage = lazy(() => import("@/pages/not-found.page"));
const ProfilePage = lazy(() => import("@/pages/profile.page"));
const ProjectsPage = lazy(() => import("@/pages/projects.page"));
const ProjectSettingsPage = lazy(
  () => import("@/pages/project-settings.page"),
);
const ProjectDocumentsPage = lazy(
  () => import("@/pages/project-documents.page"),
);
const ProjectDocumentDetailPage = lazy(
  () => import("@/pages/project-document-detail.page"),
);
const ProjectDocumentEditPage = lazy(
  () => import("@/pages/project-document-edit.page"),
);
const ProjectDocumentVersionsPage = lazy(
  () => import("@/pages/project-document-versions.page"),
);
const ProjectGraphPage = lazy(() => import("@/pages/project-graph.page"));
const RegisterPage = lazy(() => import("@/pages/register.page"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password.page"));
const RulePage = lazy(() => import("@/pages/rule.page"));
const SignInPage = lazy(() => import("@/pages/sign-in.page"));
const VerifyEmailPage = lazy(() => import("@/pages/verify-email.page"));
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
          {
            path: "register",
            element: (
              <LazyRoute>
                <RegisterPage />
              </LazyRoute>
            ),
          },
          {
            path: "forgot-password",
            element: (
              <LazyRoute>
                <ForgotPasswordPage />
              </LazyRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    // Trang đích của liên kết trong email — phải mở được bất kể đã đăng nhập hay chưa,
    // nên KHÔNG bọc trong AuthGuardLayout (tránh bị redirect khỏi trang).
    element: <GuestLayout />,
    children: [
      {
        path: "verify-email",
        element: (
          <LazyRoute>
            <VerifyEmailPage />
          </LazyRoute>
        ),
      },
      {
        path: "reset-password",
        element: (
          <LazyRoute>
            <ResetPasswordPage />
          </LazyRoute>
        ),
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
            // Dự án (backend) là trang mở đầu — không còn màn hình chọn Repo GitHub.
            index: true,
            element: <Navigate to="/projects" replace />,
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
            path: "projects",
            element: (
              <LazyRoute>
                <ProjectsPage />
              </LazyRoute>
            ),
          },
          {
            path: "projects/:projectId",
            element: (
              <LazyRoute>
                <ProjectSettingsPage />
              </LazyRoute>
            ),
          },
          {
            path: "projects/:projectId/documents",
            element: (
              <LazyRoute>
                <ProjectDocumentsPage />
              </LazyRoute>
            ),
          },
          {
            path: "projects/:projectId/graph",
            element: (
              <LazyRoute>
                <ProjectGraphPage />
              </LazyRoute>
            ),
          },
          {
            path: "projects/:projectId/documents/:documentId",
            element: (
              <LazyRoute>
                <ProjectDocumentDetailPage />
              </LazyRoute>
            ),
          },
          {
            path: "projects/:projectId/documents/:documentId/edit",
            element: (
              <LazyRoute>
                <ProjectDocumentEditPage />
              </LazyRoute>
            ),
          },
          {
            path: "projects/:projectId/documents/:documentId/versions",
            element: (
              <LazyRoute>
                <ProjectDocumentVersionsPage />
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
