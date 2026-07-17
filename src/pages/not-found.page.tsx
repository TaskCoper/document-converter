import { buttonVariants } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-4 py-12">
      <h1 className="font-heading text-lg font-medium">404</h1>
      <p className="text-xs text-muted-foreground">
        Đường dẫn này không tồn tại trong ứng dụng.
      </p>
      <Link
        to="/"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Về trang chính
      </Link>
    </div>
  );
}
