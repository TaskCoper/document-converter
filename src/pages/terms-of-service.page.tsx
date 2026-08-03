import {
  PublicDocument,
  PublicSection,
} from "@/components/public/public-document";

export default function TermsOfServicePage() {
  return (
    <>
      <title>Điều khoản sử dụng | Document First</title>
      <PublicDocument
        title="Điều khoản sử dụng"
        summary="Các điều khoản này áp dụng khi bạn truy cập hoặc sử dụng website, API, MCP server và plugin Document First."
      >
        <PublicSection title="1. Chấp nhận điều khoản">
          <p>
            Bằng việc sử dụng Document First, bạn xác nhận có thẩm quyền chấp nhận các điều khoản
            này cho bản thân hoặc tổ chức của mình. Nếu không đồng ý, bạn không được tiếp tục sử
            dụng dịch vụ.
          </p>
        </PublicSection>

        <PublicSection title="2. Phạm vi dịch vụ">
          <p>
            Document First hỗ trợ quản lý User Story, Business Rule, TDD và tài liệu phần mềm liên
            quan. Plugin cung cấp ngữ cảnh đã được phê duyệt cho ChatGPT và Codex thông qua MCP; nó
            không tự phê duyệt tài liệu và không thay thế quyết định của người có thẩm quyền.
          </p>
        </PublicSection>

        <PublicSection title="3. Tài khoản và quyền truy cập">
          <p>
            Bạn phải cung cấp thông tin tài khoản chính xác, bảo vệ thông tin đăng nhập và chỉ truy
            cập project được cấp quyền. Bạn chịu trách nhiệm thông báo kịp thời khi nghi ngờ tài
            khoản hoặc OAuth grant bị sử dụng trái phép.
          </p>
        </PublicSection>

        <PublicSection title="4. Sử dụng được phép">
          <p>Bạn không được:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Truy cập dữ liệu của tenant hoặc project khi chưa được cho phép.</li>
            <li>Vượt qua cơ chế xác thực, phân quyền, giới hạn tần suất hoặc kiểm soát bảo mật.</li>
            <li>Phát tán mã độc, gây gián đoạn dịch vụ hoặc sử dụng dịch vụ trái pháp luật.</li>
            <li>Chia sẻ credential, token hoặc reviewer account cho người không được phép.</li>
          </ul>
        </PublicSection>

        <PublicSection title="5. Nội dung và quyền sở hữu">
          <p>
            Bạn và tổ chức của bạn giữ quyền đối với nội dung hợp pháp được đưa vào Document First.
            Bạn cấp cho VNZ TECHNOLOGY COMPANY quyền xử lý nội dung trong phạm vi cần thiết để cung
            cấp, bảo mật và vận hành dịch vụ. Phần mềm, thương hiệu và tài liệu sản phẩm Document
            First thuộc về VNZ TECHNOLOGY COMPANY hoặc bên cấp phép tương ứng.
          </p>
        </PublicSection>

        <PublicSection title="6. Kết quả do AI hỗ trợ">
          <p>
            Context từ Document First giúp agent dựa trên tài liệu đã phê duyệt, nhưng kết quả do AI
            tạo ra vẫn có thể thiếu hoặc sai. Bạn phải review code, test, quyết định nghiệp vụ và tác
            động bảo mật trước khi merge, deploy hoặc sử dụng trong môi trường thật.
          </p>
        </PublicSection>

        <PublicSection title="7. Tính sẵn sàng và thay đổi dịch vụ">
          <p>
            Dịch vụ có thể được bảo trì, cập nhật hoặc tạm ngừng để xử lý sự cố và rủi ro bảo mật.
            Các tính năng beta hoặc tích hợp bên thứ ba có thể thay đổi theo nền tảng liên quan.
          </p>
        </PublicSection>

        <PublicSection title="8. Tạm ngừng và chấm dứt">
          <p>
            Quyền truy cập có thể bị tạm ngừng hoặc chấm dứt khi tài khoản vi phạm điều khoản, gây
            rủi ro bảo mật, không còn thuộc tổ chức được cấp quyền hoặc theo yêu cầu hợp pháp. Bạn có
            thể yêu cầu đóng tài khoản qua kênh hỗ trợ.
          </p>
        </PublicSection>

        <PublicSection title="9. Giới hạn trách nhiệm">
          <p>
            Trong phạm vi pháp luật cho phép, trách nhiệm của mỗi bên được xác định theo thỏa thuận
            dịch vụ áp dụng. Document First không bảo đảm rằng kết quả do AI hỗ trợ luôn chính xác
            hoặc phù hợp để sử dụng mà không có review của con người.
          </p>
        </PublicSection>

        <PublicSection title="10. Luật áp dụng và liên hệ">
          <p>
            Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam, trừ khi thỏa thuận bằng văn
            bản giữa các bên quy định khác. Câu hỏi về điều khoản gửi tới{" "}
            <a
              href="mailto:info@vnzdna.com"
              className="text-primary underline-offset-4 hover:underline"
            >
              info@vnzdna.com
            </a>
            .
          </p>
        </PublicSection>
      </PublicDocument>
    </>
  );
}
