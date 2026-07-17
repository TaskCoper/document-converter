import { createBrowserRouter } from "react-router-dom";

import RootLayout from "@/layout";
import BrowsePage from "@/pages/browse.page";
import ConvertPage from "@/pages/convert.page";
import FilesPage from "@/pages/files.page";
import NotFoundPage from "@/pages/not-found.page";
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
      { path: "convert", element: <ConvertPage key="create" /> },
      { path: "edit/*", element: <ConvertPage key="edit" /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
