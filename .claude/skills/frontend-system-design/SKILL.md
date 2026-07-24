---
name: frontend-system-design
description: Bắt buộc dùng khi tạo BẤT KỲ UI mới nào trong document-converter — page, dialog, form section, bảng, panel, toolbar, hay component. Trước khi viết JSX, phải lập một "system design" ngắn bám theo hệ thiết kế hiện có (spreadsheet-dense, token-only, rounded-none, tiếng Việt) rồi mới code theo đúng luật. Dùng cả khi user nói "thêm trang", "thêm màn hình", "tạo component", "làm UI cho...".
---

# Thiết kế UI mới trong VNZ Converter

App này có một ngôn ngữ thiết kế **rất nhất quán và cố ý**: giao diện dày đặc kiểu
bảng tính (Google Sheets / Excel), chữ nhỏ, góc vuông, chỉ dùng semantic token, full-height
flexbox, và **toàn bộ chữ hiển thị bằng tiếng Việt**. UI mới phải hoà vào ngôn ngữ đó, không
được mang phong cách "landing page" (bo góc lớn, khoảng trắng rộng, gradient, shadow nổi).

## Bước 1 — Lập system design TRƯỚC khi viết JSX (bắt buộc)

Với mỗi UI mới, viết ra ngắn gọn (vài dòng) rồi mới code:

1. **Nó là gì**: page / dialog / form section / bảng / panel / toolbar.
2. **Khung layout**: full-height (`flex h-full flex-col overflow-hidden`) hay content thường?
   Vùng nào cuộn (`min-h-0` + `overflow-y-auto`)? Toolbar trên, nội dung giữa, tab/hành động dưới?
3. **Primitive tái sử dụng**: liệt kê component lấy từ [src/components/ui/](../../../src/components/ui/)
   (Button, Field, Input, Select, Table, Dialog, AlertDialog, Spinner...). **Không tự viết lại**
   thứ đã có.
4. **Nguồn dữ liệu**: React Query qua `ghKeys` ([src/lib/query-keys.ts](../../../src/lib/query-keys.ts)),
   hay Zustand store? Có mutation không → có cần `withSitemap` không (xem CLAUDE.md).
5. **Trạng thái**: loading (Spinner / skeleton `animate-pulse bg-muted`), error (`text-xs text-destructive`),
   empty (chữ muted căn giữa). Liệt kê đủ ba.

Nếu UI đủ lớn (một page mới), tham chiếu một page có sẵn cùng dạng để bám pattern:
[browse.page.tsx](../../../src/pages/browse.page.tsx) (bảng + toolbar + tab đáy),
[stories.page.tsx](../../../src/pages/stories.page.tsx) (form wizard 2 cột + preview).

## Bước 2 — Luật thiết kế (không được vi phạm)

**Màu — chỉ semantic token, không bao giờ hex/màu Tailwind thô.**
Bảng token định nghĩa ở [index.css](../../../src/index.css) (oklch, có `.dark`). Dùng:
`bg-background` `text-foreground` `text-muted-foreground` `border-border` `bg-muted` `text-primary`
`bg-primary/text-primary-foreground` `text-destructive`/`bg-destructive/10`. `primary` là màu cam —
dùng cho phần tử đang chọn / nhấn mạnh, không phải cho mọi nút. Toàn repo **0 mã hex** và mọi
primitive đều theo token — giữ nguyên như vậy.

**Góc vuông.** `rounded-none` là mặc định của Button và phần lớn primitive. Không thêm `rounded-lg`,
`rounded-xl`. Nếu cần bo, tối đa `rounded` (nhỏ) và phải có lý do.

**Mật độ cao — chữ nhỏ, khoảng cách chặt.** `text-xs` là cỡ chữ mặc định của UI (không phải
`text-sm`). Meta/label phụ dùng `text-[10px]` (thường kèm `uppercase tracking-wide text-muted-foreground`).
Tiêu đề khu vực `text-lg font-semibold text-primary` là kịch trần. Chiều cao control nhỏ:
`h-6`/`h-7`/`h-8`. Icon Lucide `size-3` / `size-3.5` / `size-4`. Không dùng padding rộng kiểu `p-8`;
`gap-8` chỉ dùng cho khoảng cách cột lớn ở form.

**Full-height & vùng cuộn.** `<main>` đã là `min-h-0 flex-1 overflow-y-auto`
([default.layout.tsx](../../../src/layouts/default.layout.tsx)). Page dạng bảng bọc trong
`flex h-full flex-col overflow-hidden`, chia toolbar (`shrink-0`) / nội dung (`flex-1 overflow-auto`) /
đáy (`shrink-0`). Mọi vùng cuộn phải có `min-h-0` ở cha flex, nếu không sẽ tràn.

**Bảng kiểu spreadsheet.** Ô có viền `border border-border/40`, padding `px-2 py-1.5`, header
`bg-muted/60` + `sticky top-0 z-10`, cột STT nhỏ `text-[10px] text-muted-foreground`. Hàng click được:
`cursor-pointer hover:bg-primary/5`. Bám đúng [browse.page.tsx](../../../src/pages/browse.page.tsx).

## Bước 3 — Nếu là FORM

- Dùng **react-hook-form + Zod resolver**. Zod schema trong `features/*/validations.ts` là hình dạng
  chuẩn — sửa UI đừng làm lệch schema.
- Bọc bằng primitive `Field` / `FieldGroup` / `FieldLabel` / `FieldError` / `FieldSet` / `FieldLegend`
  ([field.tsx](../../../src/components/ui/field.tsx)). Input/Textarea dùng `register`, Select bọc
  `Controller`. Đánh dấu lỗi bằng `data-invalid` + `aria-invalid` như
  [metadata-section.tsx](../../../src/features/user-stories/components/metadata-section.tsx).
- **Đặt tên file section theo pattern `*-section.tsx` hoặc `*-form-sections.tsx`.** React Compiler bị
  TẮT cho đúng các file này qua filter trong [vite.config.ts](../../../vite.config.ts) vì chúng là
  form của react-hook-form. Đặt sai tên → compiler áp vào → form dễ hỏng.
- Nhận props qua type `SectionProps` (`register`, `control`, `errors`).

## Bước 4 — Hành động phá huỷ & mutation

- Xoá/ghi đè phải qua `AlertDialog` xác nhận, nêu rõ "tạo một commit và không thể hoàn tác từ giao diện",
  và **chặn khi chưa có tên tác giả** (`useAuthorStore`) — mẫu ở cuối
  [browse.page.tsx](../../../src/pages/browse.page.tsx).
- Nút đang chạy hiện `<Spinner className="size-3.5" />` và `disabled` trong lúc pending.
- Mutation ghi tài liệu phải giữ sitemap đúng (`withSitemap`) rồi invalidate `ghKeys` — xem CLAUDE.md
  mục "Auto-generated sitemaps".

## Bước 5 — Tiếng Việt

Mọi nhãn, placeholder, nút, tiêu đề, thông báo lỗi đều bằng **tiếng Việt** (VD: "Lưu", "Huỷ",
"Xoá vĩnh viễn", "Chưa có thư mục nào."). Chuỗi có dấu là bình thường — không né ký tự Unicode.

## Checklist trước khi coi là xong

- [ ] Đã viết system design (Bước 1) và bám một page/section mẫu.
- [ ] 0 mã hex, 0 màu Tailwind thô — chỉ semantic token.
- [ ] `rounded-none` (hoặc có lý do rõ nếu bo góc).
- [ ] `text-xs` làm nền, control `h-6/7/8`, icon `size-3/3.5/4`.
- [ ] Layout full-height đúng chuỗi `min-h-0` + `overflow-y-auto` nếu cần cuộn.
- [ ] Tái dùng primitive trong `components/ui/`, không dựng lại.
- [ ] Form: đúng tên `*-section.tsx`, dùng `Field*` + Zod + rhf.
- [ ] Có đủ trạng thái loading / error / empty.
- [ ] Hành động phá huỷ có AlertDialog + chặn thiếu tác giả.
- [ ] Toàn bộ chữ hiển thị bằng tiếng Việt.
