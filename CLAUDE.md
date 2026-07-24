# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (see `pnpm-lock.yaml`).

- `pnpm dev` — start Vite dev server on **port 3000**
- `pnpm build` — type-check (`tsc -b`) then production build
- `pnpm lint` — ESLint over the repo
- `pnpm preview` — serve the production build

There is **no test runner** configured in this project.

## What this app is

"VNZ Converter" (`vnz-converter`) is a client-only React 19 + TypeScript + Vite SPA
for authoring three kinds of software-spec documents — **User Stories**, **Technical
Design Documents (TDDs)**, and **Business Rules** — and persisting them as Markdown
**directly into a GitHub repository**. There is no backend for the documents: the
browser talks to the GitHub REST/Git-Data API. The UI and all user-facing strings are
in **Vietnamese**; documents commonly contain Vietnamese text (UTF-8 handling matters,
see below).

## Architecture

### Documents live in GitHub, not a database
`src/lib/github/` is a self-contained GitHub client (axios instance, `baseURL:
api.github.com`). Key facts:
- Writes go through the **Git Data API** (`git/trees` → `git/commits` → `git/refs`),
  not the simple Contents `PUT`, so multiple file changes land in **one atomic commit**
  (`commitFiles` / `attemptCommit` in `api.ts`). It retries up to 3× on non-fast-forward
  conflicts.
- Reads decode base64 with a **UTF-8-safe decoder** (`decodeB64`) — plain `atob`
  corrupts Vietnamese characters. Writes send raw UTF-8 in the tree `content` field, so
  there is no encode counterpart.
- Every request is scoped to the **active repo** (`requireActiveRepo`) and to that
  repo's `rootDir` via `scoped()` / `stripRoot()`. All CRUD is confined to `rootDir`.

### Active-repo model
`src/features/repos/store.ts` is a persisted (localStorage) Zustand store of multiple
`RepoConfig`s. One is "active"; every GitHub call reads it through `getActiveRepo()`. On
first run it seeds a repo from `VITE_GH_*` env vars. **When the active repo changes,
`main.tsx` drops all React Query caches under the `["gh"]` key** — cached listings/files
from the previous repo would otherwise produce wrong UI or wrong writes.

### Auto-generated sitemaps (do not hand-edit)
Each folder gets a `sitemap.md` and there is a root `sitemap.md`; both are
`_Auto-generated. Do not edit manually._`. `src/lib/sitemap/` builds/parses them and
`src/hooks/gh-mutation-helpers.ts#withSitemap` **splices a document change into the
affected folder sitemap(s) and the root sitemap, appending them to the same commit** as
the document write. The list hooks (`use-all-tdds`, `use-all-stories`, `use-all-rules`)
read documents *by parsing sitemaps*, not by walking the tree — so keeping sitemaps
correct on every mutation is load-bearing. Mutation hooks in `src/hooks/` all follow
this pattern; mirror it (call `withSitemap`, then invalidate the matching `ghKeys`).

### Feature modules (one per document type)
`src/features/{user-stories,tdds,business-rules}/` each contain the same shape:
- `validations.ts` — the **Zod schema** that is the canonical shape of the document,
  plus enum label maps.
- `exporters.ts` — the **round-trip**: `toMarkdown(data)` and `fromMarkdown(md)` (git
  stores Markdown; the form is derived from it and exported back), `toHtml(data)` (a
  Google-Sheets-style `waffle` table for preview/export), and `toSampleMarkdown()` (a
  commented template users fill in / paste into an LLM, then re-import). The Markdown
  format IS the contract — heading names and bullet prefixes are parsed literally, so
  changing one requires updating both directions.
- `store.ts` (Zustand form state), `components/*-section.tsx`, `hooks/use-all-*.ts`.

### Two separate axios clients
Do not confuse them: `src/lib/github/` (documents) vs `src/lib/auth/` (the *user* auth
backend at `VITE_AUTH_API_BASE_URL`). The auth client (`lib/auth/api.ts`) has a
cookie-based **refresh-token interceptor** with request queuing. Auth state lives in
`src/features/auth/store.ts` (JWT decoded client-side). Local dev can bypass the backend
with **fake tokens** (`features/auth/fake.ts`) — any token ending in `.fake-signature`
is recognized as fake and skips network calls like `/me`.

### Routing
`src/router.tsx` — `createBrowserRouter`, lazy pages, wrapped in `AuthGuardLayout`.
Create-vs-edit routes (e.g. `stories` vs `edit/*`, `tdd` vs `edit-tdd/*`) render the
same page component with a different React `key` to force a clean remount.

## Conventions

- Path alias `@/` → `src/` (Vite + tsconfig). shadcn/ui components live in
  `src/components/ui/` (style `base-lyra`, Tailwind v4, Lucide icons).
- **React Compiler is enabled** (`babel-plugin-react-compiler`) but explicitly
  **disabled for `*-section.tsx` and `*-form-sections.tsx`** files via the `sources`
  filter in `vite.config.ts` — these are react-hook-form form sections. Keep new form
  sections matching those name patterns, or adjust the filter if compilation breaks
  them.
- React Query keys and stale time are centralized in `src/lib/query-keys.ts`
  (`ghKeys`, `authKeys`, `GH_STALE`). Use them; do not inline key arrays.
- GitHub errors are normalized to `GhError` with a `kind` (`NOT_FOUND`, `CONFLICT`,
  `RATE_LIMIT`, …); handle by `kind`, and note `NOT_FOUND` is often used as an
  expected "does not exist yet" signal rather than a hard error.
- `VITE_*` vars are bundled into client JS and are **not secret** (the GitHub token is
  a fine-grained PAT scoped to one repo with Contents:read/write). `.env.example`
  documents them.
