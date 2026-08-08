import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSignOut } from "@/features/auth/hooks/use-sign-out";
import { useAuthStore } from "@/features/auth/store";
import { LogInIcon, LogOutIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function AuthWidget() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { signOut, isSigningOut } = useSignOut();
  const [open, setOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        render={<Link to="/sign-in" />}
      >
        <LogInIcon className="size-3.5" />
        Đăng nhập
      </Button>
    );
  }

  const shortEmail = user.Email?.split("@")[0] ?? "user";
  const avatarName = user.Email || shortEmail;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
          >
            <UserAvatar name={avatarName} />
            <span>{shortEmail}</span>
          </Button>
        }
      />

      <PopoverContent align="end" className="w-52 p-1">
        <div className="border-b px-2 py-1.5">
          <p className="truncate text-xs font-medium">{user.Email}</p>
          <p className="text-[10px] text-muted-foreground">{user.Role}</p>
        </div>

        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => setOpen(false)}
            render={<Link to="/profile" />}
          >
            <UserIcon className="size-3.5" />
            Hồ sơ
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-destructive hover:text-destructive"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            disabled={isSigningOut}
          >
            <LogOutIcon className="size-3.5" />
            Đăng xuất
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
