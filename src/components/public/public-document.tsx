import type { ReactNode } from "react";

interface PublicDocumentProps {
  title: string;
  summary: string;
  children: ReactNode;
}

interface PublicSectionProps {
  title: string;
  children: ReactNode;
}

export function PublicDocument({
  title,
  summary,
  children,
}: PublicDocumentProps) {
  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="border-b border-border pb-4">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          VNZ TECHNOLOGY COMPANY · Việt Nam
        </p>
        <h1 className="mt-1 font-heading text-lg font-semibold text-primary">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
          {summary}
        </p>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Cập nhật lần cuối: 03/08/2026
        </p>
      </header>

      <div className="mt-6 space-y-6 text-xs leading-5">{children}</div>
    </article>
  );
}

export function PublicSection({ title, children }: PublicSectionProps) {
  return (
    <section className="space-y-2" aria-labelledby={toSectionId(title)}>
      <h2
        id={toSectionId(title)}
        className="font-heading text-sm font-semibold text-foreground"
      >
        {title}
      </h2>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

function toSectionId(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
