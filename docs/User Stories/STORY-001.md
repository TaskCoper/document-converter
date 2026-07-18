# STORY-001

## Metadata

- **Story**: Là một người dùng đã đăng nhập, tôi muốn đặt lại mật khẩu của mình để có thể truy cập tài khoản khi quên mật khẩu.
- **Context**: Người dùng quên mật khẩu và cần một luồng tự phục vụ để đặt lại mà không cần liên hệ hỗ trợ. Tính năng này giảm tải cho bộ phận hỗ trợ khách hàng và cải thiện trải nghiệm người dùng.
- **Sprint**: 3
- **Priority**: Must
- **Status**: In Progress
- **Creator**: Danh Nguyen
- **Assignee**:
  - Frontend: Nguyễn Văn A
  - Backend: Trần Thị B
  - Frontend: Phạm Minh C
  - Backend: Lê Hoàng D

## Conditions

### Preconditions

- Người dùng đã có tài khoản hợp lệ trong hệ thống
- Tài khoản chưa bị khóa hoặc vô hiệu hóa
- Email đăng ký còn hoạt động và có thể nhận thư
- Người dùng đang ở trang đăng nhập hoặc trang quên mật khẩu
- Hệ thống gửi email (SMTP/SES) đang hoạt động bình thường

### Trigger

Người dùng nhấn vào liên kết 'Quên mật khẩu?' trên trang đăng nhập.

## Flow

### Main Flow

1. Người dùng nhấn 'Quên mật khẩu?' trên trang đăng nhập
2. Hệ thống hiển thị form nhập địa chỉ email
3. Người dùng nhập email và nhấn 'Gửi'
4. Hệ thống validate định dạng email phía client
5. Hệ thống xác minh email tồn tại trong cơ sở dữ liệu
6. Hệ thống tạo token đặt lại mật khẩu ngẫu nhiên (UUID v4) và lưu vào DB với thời gian hết hạn
7. Hệ thống gửi email chứa liên kết đặt lại mật khẩu (có hiệu lực 15 phút)
8. Hệ thống hiển thị thông báo: 'Kiểm tra hộp thư của bạn'
9. Người dùng mở email và nhấn vào liên kết đặt lại
10. Hệ thống xác minh token còn hiệu lực và chưa được sử dụng
11. Hệ thống hiển thị form nhập mật khẩu mới
12. Người dùng nhập mật khẩu mới và xác nhận mật khẩu
13. Hệ thống validate mật khẩu theo quy tắc nghiệp vụ
14. Hệ thống cập nhật mật khẩu mới (hash bcrypt) và vô hiệu hóa token
15. Hệ thống tự động đăng xuất tất cả session hiện tại của tài khoản
16. Hệ thống chuyển hướng đến trang đăng nhập với thông báo thành công

### Alternative Flow

#### ALT-01

1. Email không tồn tại trong hệ thống
2. Hệ thống hiển thị thông báo: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn' (tránh tiết lộ thông tin)
3. Luồng kết thúc mà không gửi email

#### ALT-02

1. Người dùng đã gửi yêu cầu trong vòng 2 phút gần nhất
2. Hệ thống hiển thị thông báo: 'Vui lòng chờ X giây trước khi gửi lại'
3. Nút 'Gửi' bị vô hiệu hóa đếm ngược
4. Sau khi đếm ngược kết thúc, người dùng có thể gửi lại

#### ALT-03

1. Người dùng nhập hai mật khẩu không khớp nhau
2. Hệ thống hiển thị lỗi inline: 'Mật khẩu xác nhận không khớp'
3. Form không được submit cho đến khi hai mật khẩu khớp

### Exception Flow

#### EXC-01

1. Liên kết đặt lại mật khẩu đã hết hạn (> 15 phút)
2. Hệ thống hiển thị trang thông báo lỗi: 'Liên kết đã hết hạn'
3. Hệ thống cung cấp nút 'Gửi lại email đặt lại mật khẩu'
4. Người dùng nhấn nút → quay lại bước 2 của luồng chính

#### EXC-02

1. Token đã được sử dụng trước đó
2. Hệ thống hiển thị thông báo: 'Liên kết này đã được sử dụng'
3. Hệ thống gợi ý người dùng kiểm tra email mới nhất hoặc yêu cầu lại

#### EXC-03

1. Dịch vụ gửi email bị lỗi hoặc timeout
2. Hệ thống ghi log lỗi và hiển thị thông báo: 'Không thể gửi email, thử lại sau'
3. Hệ thống không lưu token vào DB để tránh token mồ côi
4. Người dùng có thể thử lại sau vài phút

## Acceptance Criteria

#### AC-001

- **Given**: Người dùng ở trang đăng nhập
- **When**: Người dùng nhấn 'Quên mật khẩu?' và nhập email hợp lệ đã đăng ký
- **Then**: Email đặt lại mật khẩu được gửi trong vòng 30 giây
- **And**: Liên kết trong email hết hạn sau 15 phút
- **And**: Token trong liên kết chỉ được sử dụng một lần duy nhất

#### AC-002

- **Given**: Người dùng có liên kết đặt lại mật khẩu hợp lệ chưa hết hạn
- **When**: Người dùng nhập mật khẩu mới thỏa mãn quy tắc và xác nhận đúng
- **Then**: Mật khẩu được cập nhật thành công
- **And**: Tất cả session đang hoạt động bị đăng xuất
- **And**: Người dùng được chuyển hướng đến trang đăng nhập

#### AC-003

- **Given**: Người dùng nhập email không tồn tại trong hệ thống
- **When**: Người dùng submit form quên mật khẩu
- **Then**: Hệ thống hiển thị thông báo trung tính không tiết lộ email có tồn tại hay không
- **And**: Không có email nào được gửi đi

#### AC-004

- **Given**: Người dùng đã gửi yêu cầu đặt lại mật khẩu trong vòng 2 phút
- **When**: Người dùng thử gửi yêu cầu lần thứ hai
- **Then**: Hệ thống từ chối và hiển thị thời gian chờ còn lại

## Activity Diagram

https://lucid.app/lucidchart/example-activity-diagram

## References

### Business Rules

- BR-05: Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số
- BR-06: Không được đặt lại thành mật khẩu giống 3 mật khẩu gần nhất
- BR-07: Token đặt lại mật khẩu hết hạn sau 15 phút kể từ khi tạo
- BR-08: Giới hạn 3 lần gửi yêu cầu đặt lại mật khẩu mỗi giờ trên mỗi tài khoản

### Dependencies

- STORY-002: Xác thực email người dùng
- STORY-010: Gửi email thông báo hệ thống
- STORY-015: Quản lý session và đăng xuất
- STORY-022: Rate limiting API endpoint
- STORY-031: Ghi log audit trail bảo mật

### TDDs

- [TDD-BAOKIM-001](Technical Design Documents/TDD-BAOKIM-001.md)
- [TDD-BAOKIM-002](Technical Design Documents/TDD-BAOKIM-002.md)
- [TDD-BAOKIM-003](Technical Design Documents/TDD-BAOKIM-003.md)

## Non-Functional

- Thời gian phản hồi gửi email < 2 giây (P95)
- Liên kết đặt lại phải dùng HTTPS và token ngẫu nhiên an toàn (cryptographically secure)
- Không tiết lộ sự tồn tại của tài khoản qua thông báo lỗi (security by obscurity)
- Mật khẩu phải được hash bằng bcrypt với cost factor ≥ 12 trước khi lưu
- Tất cả hành động liên quan đến đặt lại mật khẩu phải được ghi vào audit log
- Giao diện phải đạt chuẩn WCAG 2.1 AA (accessibility)
- Tính năng phải hoạt động trên các trình duyệt: Chrome, Firefox, Safari, Edge (2 phiên bản mới nhất)

## Out of Scope

- Đặt lại mật khẩu qua SMS/OTP
- Hỗ trợ đăng nhập bằng mạng xã hội (OAuth)
- Đặt lại mật khẩu dành cho tài khoản admin qua giao diện này
- Tính năng khóa tài khoản sau nhiều lần thất bại (thuộc STORY-045)
- Giao diện quản lý token phía admin
