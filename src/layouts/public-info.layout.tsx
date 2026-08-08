import { buttonVariants } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";
import { Link, NavLink, Outlet } from "react-router-dom";

const navigation = [
  { to: "/privacy", label: "Quyền riêng tư" },
  { to: "/terms", label: "Điều khoản" },
  { to: "/support", label: "Hỗ trợ" },
];

export default function PublicInfoLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#noi-dung-chinh"
        className="sr-only z-50 bg-background px-3 py-2 text-xs focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:border focus:border-ring"
      >
        Bỏ qua điều hướng
      </a>

      <header className="theme-web-surface border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link
            to="/sign-in"
            className="flex min-w-0 items-center gap-2 outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Document First — đến trang đăng nhập"
          >
            <img
              src="/logo-header.png"
              alt=""
              width={480}
              height={219}
              className="h-8 w-auto shrink-0 object-contain"
            />
            <span className="truncate text-xs font-semibold">Document First</span>
          </Link>

          <div className="flex flex-wrap items-center gap-1">
            <nav aria-label="Thông tin pháp lý" className="flex flex-wrap gap-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      isActive && "bg-muted text-primary",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <ThemeSwitcher />
            <Link
              to="/sign-in"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      <main id="noi-dung-chinh" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 VNZ TECHNOLOGY COMPANY · Việt Nam</p>
          <a
            href="mailto:info@vnzdna.com"
            className="text-primary underline-offset-4 hover:underline"
          >
            info@vnzdna.com
          </a>
        </div>
      </footer>
    </div>
  );
}
