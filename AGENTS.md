# Repository Guidelines

## Project Structure & Module Organization

Application code lives in `src/`. Screens are in `src/pages/`, layouts in `src/layouts/`, shared components in `src/components/`, and utilities in `src/hooks/` and `src/lib/`. Domain code is grouped under `src/features/` (`auth`, `projects`, `repos`, `user-stories`, `tdds`, and `business-rules`). Static assets belong in `public/`; example documents live in `docs/`.

Xem file CLAUDE.md và thư mục document-converter/.claude/skills để tuân thủ các skills

The app is a client-side React SPA. Document operations use the GitHub API through `src/lib/github/`, while authentication uses the separate client in `src/lib/auth/`. Import application modules with the `@/` alias.

## Quy tắc kiểm thử giao diện bằng browser

- Luôn sử dụng `chrome-devtools` MCP để mở và kiểm thử website bằng browser thật.
- Không tạo file JavaScript, TypeScript, Python hoặc HTML tạm thời chỉ để đọc, phân tích hoặc thao tác DOM.
- Không tự viết script Playwright, Puppeteer hoặc Selenium trừ khi người dùng yêu cầu tạo bộ automated test lâu dài.
- Khi cần kiểm tra giao diện, phải dùng các công cụ browser để:
  - Mở URL hoặc route cần kiểm tra.
  - Click, nhập liệu và thực hiện luồng sử dụng thực tế.
  - Kiểm tra DOM và CSS trực tiếp.
  - Kiểm tra Console và Network khi có lỗi.
  - Chụp screenshot khi cần đối chiếu giao diện.
- Sau khi sửa frontend, phải reload browser và kiểm tra lại phần vừa sửa.
- Phải kiểm tra cả trạng thái loading, empty, error và success khi có liên quan.
- Không được kết luận đã sửa xong nếu chưa xác minh kết quả trên browser.
- Nếu `chrome-devtools` MCP không kết nối được, phải dừng và báo lỗi kết nối; không được tạo script hoặc file tạm để thay thế.
- Không thay đổi những thành phần nằm ngoài phạm vi lỗi đang xử lý.

## Quy trình hoàn thành frontend

Một thay đổi frontend chỉ được xem là hoàn thành khi:

1. Ứng dụng khởi động thành công.
2. Route liên quan mở được trên browser.
3. Không xuất hiện lỗi Console mới.
4. Request liên quan không bị lỗi ngoài dự kiến.
5. Luồng người dùng bị ảnh hưởng đã được thực hiện trực tiếp trên browser.
6. Giao diện sau khi sửa đã được kiểm tra bằng DOM snapshot hoặc screenshot.

## Build, Test, and Development Commands

Use pnpm, matching `pnpm-lock.yaml`.

- `pnpm install` — install dependencies.
- `pnpm dev` — start Vite with hot reload at `http://localhost:3000`.
- `pnpm build` — run TypeScript project checks, then create the production bundle in `dist/`.
- `pnpm lint` — lint all TypeScript and TSX files with ESLint.
- `pnpm preview` — serve the production bundle locally.

## Coding Style & Naming Conventions

Write strict TypeScript and functional React components. Follow existing two-space indentation and surrounding style; no formatter is configured. ESLint enforces TypeScript, React Hooks, and Vite refresh rules. Use kebab-case filenames such as `project-settings.page.tsx` and `use-save-file.ts`; components and types use PascalCase, while functions and hooks use camelCase.

Keep feature-specific schemas, exporters, stores, hooks, and components inside their feature directory. Use centralized query keys from `src/lib/query-keys.ts`. Form sections should retain the `*-section.tsx` or `*-form-sections.tsx` naming used by the React Compiler exclusion.

## Testing Guidelines

No test runner or coverage threshold is configured. Before submitting, run `pnpm lint` and `pnpm build`, then exercise affected routes with `pnpm dev`. If adding tests, introduce the runner and script deliberately, colocate files as `*.test.ts(x)`, and cover Markdown round trips and GitHub mutations first.

## Commit & Pull Request Guidelines

History mixes concise Vietnamese descriptions, document IDs (for example `BR-07 – ...`), and Conventional Commits such as `feat:` or `refactor(app):`. Prefer an imperative Conventional Commit subject with an optional scope. Keep each commit focused.

Pull requests should explain the user-visible change, list verification performed, link the issue or document ID, and include screenshots for UI changes. Call out environment or Markdown-format changes explicitly.

## Security & Generated Content

Copy `.env.example` to `.env.local`; never commit real tokens. All `VITE_*` values are bundled into browser code, so use only a narrowly scoped GitHub token. Do not hand-edit generated `sitemap.md` files; update them through the sitemap mutation helpers so document and index changes remain atomic.
