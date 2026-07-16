# STORY-001

## Metadata

- **Story**: Là một người dùng đã đăng nhập, tôi muốn đặt lại mật khẩu của mình để có thể truy cập tài khoản khi quên mật khẩu.
- **Context**: Người dùng quên mật khẩu và cần một luồng tự phục vụ để đặt lại mà không cần liên hệ hỗ trợ.
- **Sprint**: 3
- **Priority**: Must
- **Status**: Documentation
- **Creator**: Danh Nguyen
- **Assignee**:
  - Frontend: Nguyễn Văn A
  - Backend: Trần Thị B

## Conditions

### Preconditions

- Người dùng đã có tài khoản hợp lệ trong hệ thống
- Tài khoản chưa bị khóa
- Email đăng ký còn hoạt động

### Trigger

Người dùng nhấn vào liên kết 'Quên mật khẩu?' trên trang đăng nhập.

## Flow

### Main Flow

1. Người dùng nhấn 'Quên mật khẩu?' trên trang đăng nhập
2. Hệ thống hiển thị form nhập địa chỉ email
3. Người dùng nhập email và nhấn 'Gửi'
4. Hệ thống xác minh email tồn tại trong cơ sở dữ liệu
5. Hệ thống gửi email chứa liên kết đặt lại mật khẩu (có hiệu lực 15 phút)
6. Người dùng mở email và nhấn vào liên kết
7. Hệ thống hiển thị form nhập mật khẩu mới
8. Người dùng nhập mật khẩu mới và xác nhận
9. Hệ thống cập nhật mật khẩu và chuyển hướng đến trang đăng nhập

### Alternative Flow

#### ALT-01

1. Email không tồn tại trong hệ thống
2. Hệ thống hiển thị thông báo: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn' (bảo mật)
3. Luồng kết thúc

### Exception Flow

#### EXC-01

1. Liên kết đặt lại mật khẩu đã hết hạn (> 15 phút)
2. Hệ thống hiển thị thông báo lỗi và nút 'Gửi lại email'
3. Người dùng nhấn 'Gửi lại email' → quay lại bước 2 của luồng chính

## Acceptance Criteria

#### AC-001

- **Given**: Người dùng ở trang đăng nhập
- **When**: Người dùng nhấn 'Quên mật khẩu?' và nhập email hợp lệ
- **Then**: Email đặt lại mật khẩu được gửi trong vòng 30 giây
- **And**: Liên kết trong email hết hạn sau 15 phút

## Activity Diagram

https://lucid.app/lucidchart/example-activity-diagram

## References

### Business Rules

- BR-05: Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số

### Dependencies

- STORY-002: Xác thực email người dùng
- STORY-010: Gửi email thông báo

## Non-Functional

- Thời gian phản hồi gửi email < 2 giây (P95)
- Liên kết đặt lại phải dùng HTTPS và token ngẫu nhiên an toàn
- Không tiết lộ sự tồn tại của tài khoản qua thông báo lỗi

## Out of Scope

- Đặt lại mật khẩu qua SMS/OTP
- Hỗ trợ đăng nhập bằng mạng xã hội
