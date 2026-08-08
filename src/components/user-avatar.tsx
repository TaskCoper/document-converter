import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { useState } from "react";

const avatarVariants = cva(
  "user-avatar relative isolate flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted font-semibold uppercase text-muted-foreground",
  {
    variants: {
      size: {
        sm: "size-5 text-[9px]",
        lg: "size-16 text-lg",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
);

interface UserAvatarProps extends VariantProps<typeof avatarVariants> {
  name: string;
  src?: string | null;
  className?: string;
}

const getInitials = (name: string) => {
  const localName = name.includes("@") ? name.split("@")[0] : name;
  const parts = localName.trim().split(/[\s._-]+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toLocaleUpperCase("vi");
  return `${parts[0][0]}${parts.at(-1)![0]}`.toLocaleUpperCase("vi");
};

export function UserAvatar({
  name,
  src,
  size = "sm",
  className,
}: UserAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasImage = !!src && failedSrc !== src;

  return (
    <span
      role="img"
      aria-label={`Ảnh đại diện của ${name}`}
      data-fallback={hasImage ? "false" : "true"}
      className={cn(avatarVariants({ size }), className)}
    >
      {hasImage ? (
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        <span className="relative z-10" aria-hidden="true">
          {getInitials(name)}
        </span>
      )}
    </span>
  );
}
