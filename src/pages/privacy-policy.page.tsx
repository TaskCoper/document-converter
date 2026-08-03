import {
  PublicDocument,
  PublicSection,
} from "@/components/public/public-document";

export default function PrivacyPolicyPage() {
  return (
    <>
      <title>Chính sách quyền riêng tư | Document First</title>
      <PublicDocument
        title="Chính sách quyền riêng tư"
        summary="Chính sách này giải thích cách Document First xử lý thông tin khi bạn sử dụng website, API, MCP server và plugin dành cho ChatGPT hoặc Codex."
      >
        <PublicSection title="1. Đơn vị cung cấp dịch vụ">
          <p>
            Document First được cung cấp bởi VNZ TECHNOLOGY COMPANY tại Việt Nam.
            Mọi câu hỏi về quyền riêng tư có thể gửi tới{" "}
            <a
              href="mailto:info@vnzdna.com"
              className="text-primary underline-offset-4 hover:underline"
            >
              info@vnzdna.com
            </a>
            .
          </p>
        </PublicSection>

        <PublicSection title="2. Thông tin được xử lý">
          <ul className="list-disc space-y-1 pl-5">
            <li>Thông tin tài khoản như họ tên, email, vai trò và quyền trong project.</li>
            <li>
              Nội dung project và tài liệu mà bạn tạo, tải lên, phê duyệt hoặc chủ động yêu cầu
              Document First cung cấp cho agent.
            </li>
            <li>
              Thông tin xác thực và cấp quyền cần thiết để duy trì phiên đăng nhập, OAuth grant và
              quyền truy cập MCP.
            </li>
            <li>
              Dữ liệu vận hành như công cụ được gọi, project và document liên quan, thời gian xử
              lý, kích thước phản hồi, mã lỗi và mã tương quan.
            </li>
          </ul>
          <p>
            MCP audit không ghi nội dung Markdown, câu truy vấn tìm kiếm, access token hoặc refresh
            token vào log nghiệp vụ.
          </p>
        </PublicSection>

        <PublicSection title="3. Mục đích sử dụng">
          <p>
            Thông tin được dùng để cung cấp và bảo vệ dịch vụ; xác thực người dùng; áp dụng quyền
            theo project; tìm và trả tài liệu đã được phê duyệt; điều tra lỗi, chống lạm dụng và
            cải thiện độ tin cậy của hệ thống.
          </p>
        </PublicSection>

        <PublicSection title="4. Kết nối với ChatGPT và Codex">
          <p>
            Khi bạn kích hoạt plugin, nội dung đã được phê duyệt có thể được truyền tới ChatGPT hoặc
            Codex theo yêu cầu của bạn. Việc OpenAI xử lý dữ liệu nhận được chịu sự điều chỉnh của
            các điều khoản và chính sách áp dụng cho tài khoản OpenAI của bạn.
          </p>
          <p>
            Document First chỉ trả dữ liệu hiện tại đã được phê duyệt và nằm trong project mà tài
            khoản đang đăng nhập có quyền đọc. Draft, tài liệu đang review và tài liệu đã lưu trữ
            không được trả qua plugin.
          </p>
        </PublicSection>

        <PublicSection title="5. Lưu trữ và bảo mật">
          <p>
            Dữ liệu được lưu trong thời gian cần thiết để cung cấp dịch vụ, đáp ứng yêu cầu quản trị
            của tổ chức và tuân thủ nghĩa vụ pháp luật. Chúng tôi áp dụng kiểm soát truy cập, kết nối
            mã hóa, phân tách tenant, OAuth và nhật ký kiểm toán phù hợp với tính chất dịch vụ.
          </p>
        </PublicSection>

        <PublicSection title="6. Quyền và lựa chọn của bạn">
          <p>
            Bạn có thể yêu cầu truy cập, chỉnh sửa hoặc xóa thông tin thuộc phạm vi pháp luật và
            thỏa thuận dịch vụ cho phép. Bạn cũng có thể thu hồi OAuth grant hoặc yêu cầu quản trị
            viên gỡ quyền khỏi project. Gửi yêu cầu tới info@vnzdna.com và nêu rõ tài khoản, tổ chức
            cùng nội dung cần hỗ trợ; không gửi mật khẩu hoặc token.
          </p>
        </PublicSection>

        <PublicSection title="7. Thay đổi chính sách">
          <p>
            Chính sách có thể được cập nhật khi sản phẩm, quy định hoặc cách xử lý dữ liệu thay đổi.
            Ngày cập nhật gần nhất luôn được hiển thị ở đầu trang này.
          </p>
        </PublicSection>
      </PublicDocument>
    </>
  );
}
