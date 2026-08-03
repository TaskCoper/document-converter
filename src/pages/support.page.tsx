import {
  PublicDocument,
  PublicSection,
} from "@/components/public/public-document";
import { buttonVariants } from "@/components/ui/button";

export default function SupportPage() {
  return (
    <>
      <title>Hỗ trợ | Document First</title>
      <PublicDocument
        title="Hỗ trợ Document First"
        summary="Liên hệ VNZ TECHNOLOGY COMPANY khi bạn gặp vấn đề về tài khoản, project, OAuth, MCP hoặc plugin Document First."
      >
        <PublicSection title="Kênh hỗ trợ">
          <p>
            Gửi email tới info@vnzdna.com. Email hỗ trợ phải được gửi từ địa chỉ bạn dùng với
            Document First hoặc nêu rõ tổ chức đang quản lý tài khoản.
          </p>
          <a
            href="mailto:info@vnzdna.com?subject=H%E1%BB%97%20tr%E1%BB%A3%20Document%20First"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            Gửi email hỗ trợ
          </a>
        </PublicSection>

        <PublicSection title="Thông tin nên cung cấp">
          <ul className="list-disc space-y-1 pl-5">
            <li>Email tài khoản và tên tổ chức hoặc project liên quan.</li>
            <li>Thời điểm xảy ra lỗi kèm múi giờ và các bước để tái hiện.</li>
            <li>Plugin version, contract version và tên tool nếu lỗi liên quan MCP.</li>
            <li>Trace ID hoặc correlation ID hiển thị trong phản hồi lỗi.</li>
          </ul>
          <p>
            Không gửi mật khẩu, access token, refresh token, OAuth code hoặc toàn bộ tài liệu mật
            qua email hỗ trợ.
          </p>
        </PublicSection>

        <PublicSection title="Sự cố đăng nhập và OAuth">
          <p>
            Hãy thử disconnect rồi kết nối lại plugin, xác nhận tài khoản còn là thành viên project
            và kiểm tra trình duyệt có chặn cookie hay không. Nếu lỗi vẫn còn, gửi URL callback đã
            thấy, thời điểm xảy ra lỗi và trace ID; không sao chép authorization code hoặc token.
          </p>
        </PublicSection>

        <PublicSection title="Báo cáo bảo mật hoặc quyền riêng tư">
          <p>
            Đặt tiền tố “[Bảo mật]” hoặc “[Quyền riêng tư]” trong tiêu đề email để yêu cầu được phân
            loại đúng. Mô tả phạm vi ảnh hưởng và cách liên hệ an toàn; tránh khai thác thêm hoặc tải
            xuống dữ liệu không thuộc quyền của bạn.
          </p>
        </PublicSection>

        <PublicSection title="Tài liệu liên quan">
          <p>
            Cách dữ liệu được xử lý được mô tả tại Chính sách quyền riêng tư. Điều kiện sử dụng và
            trách nhiệm review kết quả do AI hỗ trợ được mô tả tại Điều khoản sử dụng.
          </p>
        </PublicSection>
      </PublicDocument>
    </>
  );
}
