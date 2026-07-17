import { createBrowserRouter } from "react-router-dom";

import RootLayout from "@/layout";
import BrowsePage from "@/pages/browse.page";
import FilesPage from "@/pages/files.page";
import NotFoundPage from "@/pages/not-found.page";
import RulePage from "@/pages/rule.page";
import StoriesPage from "@/pages/stories.page";
import TddPage from "@/pages/tdd.page";
import ViewPage from "@/pages/view.page";
import HistoryPage from "./pages/history.page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <BrowsePage /> },
      { path: "browse/*", element: <BrowsePage /> },
      { path: "file/*", element: <FilesPage /> },
      { path: "view/*", element: <ViewPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "stories", element: <StoriesPage key="create" /> },
      { path: "edit/*", element: <StoriesPage key="edit" /> },
      { path: "tdd", element: <TddPage key="tdd-create" /> },
      { path: "edit-tdd/*", element: <TddPage key="tdd-edit" /> },
      { path: "rules", element: <RulePage key="rule-create" /> },
      { path: "edit-rule/*", element: <RulePage key="rule-edit" /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
