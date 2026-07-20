import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useActiveRepo } from "@/features/repos/store";
import { useAuthorStore } from "@/features/user-stories/store";
import { cn } from "@/lib/utils";
import {
  BookUserIcon,
  FileCode2Icon,
  GitBranch,
  HomeIcon,
  RepeatIcon,
  ScaleIcon,
} from "lucide-react";
import { useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";

const NAV = [
  { to: "/browse", label: "Trang chủ", end: false, icon: HomeIcon },
  { to: "/stories", label: "Thêm User Story", icon: BookUserIcon },
  { to: "/tdd", label: "Thêm TDD", icon: FileCode2Icon },
  { to: "/rules", label: "Thêm Rule", icon: ScaleIcon },
];

function AuthorPrompt() {
  const name = useAuthorStore((s) => s.name);
  const setName = useAuthorStore((s) => s.setName);
  const [value, setValue] = useState("");

  const open = !name;

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Bạn là ai?</DialogTitle>
          <DialogDescription>
            Tên này sẽ hiển thị trong mọi commit bạn tạo trên GitHub.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="author-name">Tên hiển thị</FieldLabel>
          <Input
            id="author-name"
            autoFocus
            placeholder="Ví dụ: Nguyễn Văn A"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim()) setName(value);
            }}
          />
        </Field>
        <div className="flex justify-end">
          <Button disabled={!value.trim()} onClick={() => setName(value)}>
            Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AuthorField() {
  const name = useAuthorStore((s) => s.name);
  const setName = useAuthorStore((s) => s.setName);
  const [local, setLocal] = useState(name);
  const [lastName, setLastName] = useState(name);
  if (lastName !== name) {
    setLastName(name);
    setLocal(name);
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Tên:</span>
      <Input
        className="h-7 w-40"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => local.trim() && setName(local)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        }}
      />
    </div>
  );
}

export default function RootLayout() {
  const activeRepo = useActiveRepo();
  const { pathname } = useLocation();
  const onPicker = pathname === "/";

  if (!activeRepo && !onPicker) {
    return <Navigate to="/" replace />;
  }

  const repoLabel = activeRepo
    ? activeRepo.label ||
      `${activeRepo.owner}/${activeRepo.repo}@${activeRepo.branch}${
        activeRepo.rootDir ? `:${activeRepo.rootDir}/` : ""
      }`
    : "Chưa chọn kho";

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="z-40 shrink-0 border-b border-border bg-background">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-4 px-4">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-xs font-medium hover:text-primary"
            title="Đổi kho"
          >
            <GitBranch className="size-4" />
            <span>{repoLabel}</span>
            {activeRepo && <RepeatIcon className="size-3 opacity-60" />}
          </NavLink>

          {activeRepo && (
            <nav className="flex items-center gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "rounded-none px-2.5 py-1 text-xs transition-colors hover:bg-muted",
                      isActive && "bg-primary text-primary-foreground",
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    {item.icon && <item.icon className="size-3.5" />}
                    {item.label}
                  </div>
                </NavLink>
              ))}
            </nav>
          )}
          <div className="ml-auto">
            <AuthorField />
          </div>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <AuthorPrompt />
    </div>
  );
}
