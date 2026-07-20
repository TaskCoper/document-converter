import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteFile } from "@/hooks/use-delete-file";
import { useFile } from "@/hooks/use-file";
import { useSaveFile } from "@/hooks/use-save-file";
import { GhError, messageFor, parentOf } from "@/lib/github";
import { useAuthorStore } from "@/features/user-stories/store";
import { ExternalLink, History, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

export default function FilesPage() {
  const { "*": rest = "" } = useParams();
  const path = rest.replace(/^\/+|\/+$/g, "");
  const navigate = useNavigate();
  const author = useAuthorStore((s) => s.name);

  const { data, isPending, error, refetch } = useFile(path);
  const save = useSaveFile();
  const del = useDeleteFile();

  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [seededSha, setSeededSha] = useState<string | null>(null);

  if (data && data.sha !== seededSha) {
    setSeededSha(data.sha);
    setText(data.content);
    setMessage(`Update ${path} via web`);
  } else if (data === null && seededSha !== null) {
    setSeededSha(null);
  }

  if (isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <p className="text-xs text-muted-foreground">Đang tải file…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6">
        <p className="text-xs text-destructive">{messageFor(error)}</p>
        <div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6">
        <p className="text-xs">
          File <code>{path}</code> không tồn tại.
        </p>
        <div className="flex gap-2">
          <Link
            to="/stories"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            Tạo qua Stories
          </Link>
          <Link
            to={`/browse/${parentOf(path)}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Quay lại thư mục
          </Link>
        </div>
      </div>
    );
  }

  const dirty = text !== data.content;
  const conflict =
    save.error instanceof GhError && save.error.kind === "CONFLICT";

  async function onSave() {
    if (!author) return;
    try {
      await save.mutateAsync({
        path,
        content: text,
        message: message || `Update ${path} via web`,
        websiteUser: author,
      });
    } catch {
      /* handled via save.error */
    }
  }

  async function onDelete() {
    if (!author || !data) return;
    try {
      await del.mutateAsync({
        path,
        message: `Delete ${path} via web`,
        websiteUser: author,
      });
      navigate(`/browse/${parentOf(path)}`);
    } catch {
      /* handled via del.error */
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate font-heading text-sm font-medium">{path}</h1>
          <p className="text-xs text-muted-foreground">
            sha: <code>{data.sha.slice(0, 7)}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={data.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ExternalLink className="size-3.5" />
            GitHub
          </a>
          <Link
            to={`/history?path=${encodeURIComponent(path)}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <History className="size-3.5" />
            Lịch sử
          </Link>
          <Dialog>
            <DialogTrigger render={<Button variant="destructive" size="sm" />}>
              <Trash2 className="size-3.5" />
              Xoá
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xoá file này?</DialogTitle>
                <DialogDescription>
                  Xoá <code>{path}</code> khỏi nhánh. Hành động này tạo một
                  commit và không thể hoàn tác từ giao diện.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton>
                <Button
                  variant="destructive"
                  onClick={onDelete}
                  disabled={del.isPending || !author}
                >
                  Xoá vĩnh viễn
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Field>
        <FieldLabel htmlFor="content">Nội dung</FieldLabel>
        <Textarea
          id="content"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[50vh] font-mono"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="commit-message">Commit message</FieldLabel>
        <Input
          id="commit-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Field>

      <div className="flex items-center gap-3">
        <Button onClick={onSave} disabled={!dirty || save.isPending || !author}>
          {save.isPending ? (
            <Spinner className="size-3.5" />
          ) : (
            <Save className="size-3.5" />
          )}
          Commit & Push
        </Button>
        {!author && (
          <span className="text-xs text-destructive">
            Cần đặt tên hiển thị trước khi commit.
          </span>
        )}
        {save.isSuccess && !dirty && (
          <span className="text-xs text-muted-foreground">Đã đẩy ✓</span>
        )}
      </div>

      {save.error && (
        <div className="flex flex-col gap-2 border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
          <p>{messageFor(save.error)}</p>
          {conflict && (
            <div>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Tải lại phiên bản mới nhất
              </Button>
            </div>
          )}
        </div>
      )}

      {del.error && (
        <p className="text-xs text-destructive">{messageFor(del.error)}</p>
      )}
    </div>
  );
}
