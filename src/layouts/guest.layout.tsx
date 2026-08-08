import { ThemeSwitcher } from "@/components/theme-switcher";
import { Outlet } from "react-router-dom";

export default function GuestLayout() {
  return (
    <div className="theme-web-surface relative flex min-h-screen items-center justify-center bg-muted/30 p-4 text-foreground">
      <div className="fixed right-3 top-3 z-40">
        <ThemeSwitcher />
      </div>
      <Outlet />
    </div>
  );
}
