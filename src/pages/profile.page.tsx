import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useGetMe } from "@/features/auth/hooks/use-get-me";
import { useSignOut } from "@/features/auth/hooks/use-sign-out";
import { useAuthStore } from "@/features/auth/store";
import { LogOutIcon, MailIcon, ShieldIcon, UserIcon } from "lucide-react";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { me, isGettingMe } = useGetMe();
  const { signOut, isSigningOut } = useSignOut();

  // Prefer the fresh /me response, fall back to the decoded JWT payload
  // (this is what powers the "fake sign-in" flow where /me is never called).
  const displayEmail = me?.email ?? user?.Email ?? "—";
  const displayName = me
    ? `${me.firstName} ${me.lastName}`.trim() || me.email
    : (user?.Email?.split("@")[0] ?? "—");
  const role = me?.role ?? user?.Role ?? "—";
  const verified = me ? me.isEmailVerified : user?.IsVerified === "true";

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <UserIcon className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl font-semibold">{displayName}</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MailIcon className="size-3.5" />
                <span>{displayEmail}</span>
                {isGettingMe && <Spinner className="size-3" />}
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            disabled={isSigningOut}
          >
            {isSigningOut ? <Spinner /> : <LogOutIcon />}
            Đăng xuất
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant="secondary">
            <ShieldIcon className="mr-1 size-3" />
            {role}
          </Badge>
          <Badge variant={verified ? "default" : "destructive"}>
            {verified ? "Đã xác thực" : "Chưa xác thực"}
          </Badge>
        </div>

        <div className="mt-6 border-t pt-4 text-xs text-muted-foreground">
          <p>User ID: {user?.UserId ?? "—"}</p>
          <p>Organization: {user?.OrganizationId || "—"}</p>
        </div>
      </Card>
    </div>
  );
}
