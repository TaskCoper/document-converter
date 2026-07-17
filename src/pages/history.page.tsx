import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { messageFor, useHistory } from "@/lib/queries";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function HistoryPage() {
  const [search, setSearch] = useSearchParams();
  const pathParam = search.get("path") ?? "";
  const [local, setLocal] = useState(pathParam);
  const [lastPath, setLastPath] = useState(pathParam);
  if (lastPath !== pathParam) {
    setLastPath(pathParam);
    setLocal(pathParam);
  }

  const { data, isPending, error, refetch, isFetching } = useHistory(
    pathParam || undefined,
  );

  function apply(next: string) {
    const trimmed = next.trim();
    if (trimmed) setSearch({ path: trimmed });
    else setSearch({});
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6">
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-sm font-medium">Lịch sử commit</h1>
          <p className="text-xs text-muted-foreground">
            {pathParam ? `Lọc theo file: ${pathParam}` : "Toàn bộ nhánh."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            className="w-72"
            placeholder="Đường dẫn file (bỏ trống = toàn bộ)"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply(local);
            }}
          />
          <Button variant="outline" size="sm" onClick={() => apply(local)}>
            Áp dụng
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Tải lại
          </Button>
        </div>
      </div>

      {isPending && <p className="text-xs text-muted-foreground">Đang tải…</p>}
      {error && <p className="text-xs text-destructive">{messageFor(error)}</p>}

      {data && data.length === 0 && (
        <p className="text-xs text-muted-foreground">Không có commit nào.</p>
      )}

      {data && data.length > 0 && (
        <ul className="divide-y divide-border border border-border">
          {data.map((c) => (
            <li key={c.sha} className="flex flex-col gap-1 px-3 py-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{c.author}</span>
                <span className="text-muted-foreground">
                  {new Date(c.date).toLocaleString()}
                </span>
              </div>
              <p className="text-muted-foreground">
                {c.message.split("\n")[0]}
              </p>
              <a
                href={c.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="size-3" />
                {c.shortSha}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
