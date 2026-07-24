import authApi, { type BaseResponse } from "@/lib/auth/api";
import type { LoginResult, Me } from "./types";
import type {
  ForgotPasswordFormValues,
  RegisterFormValues,
  SignInFormValues,
} from "./validations";

// Vỏ trả về của forgot-password / resend-verification: backend cố tình trả cùng một
// thông điệp trung lập dù email có tồn tại hay không (chống dò email có tài khoản).
interface NeutralAck {
  message: string;
}

class UserService {
  register = async ({ body }: { body: RegisterFormValues }) => {
    // Chỉ gửi đúng field backend cần; confirmPassword là ràng buộc phía client.
    const { data } = await authApi.post<BaseResponse<Me>>(`/auth/register`, {
      email: body.email,
      password: body.password,
      fullName: body.fullName,
    });
    return data.value;
  };

  signIn = async ({ body }: { body: SignInFormValues }) => {
    const { data } = await authApi.post<BaseResponse<LoginResult>>(
      `/auth/login`,
      body,
    );
    return data.value;
  };

  signOut = async () => {
    // Refresh token nằm trong cookie httpOnly; backend tự đọc để thu hồi phiên.
    const { data } = await authApi.post<BaseResponse<null>>(`/auth/logout`, {});
    return data.value;
  };

  // Thu hồi mọi phiên trên mọi thiết bị (cần đang đăng nhập — [Authorize]).
  signOutAll = async () => {
    const { data } = await authApi.post<BaseResponse<null>>(
      `/auth/logout-all`,
      {},
    );
    return data.value;
  };

  getMe = async () => {
    const { data } = await authApi.get<BaseResponse<Me>>(`/auth/me`);
    return data.value;
  };

  // Xác thực email bằng token trong liên kết gửi qua email.
  verifyEmail = async ({ token }: { token: string }) => {
    const { data } = await authApi.post<BaseResponse<null>>(
      `/auth/verify-email`,
      { token },
    );
    return data.value;
  };

  // Gửi lại email xác thực. Trả về thông điệp trung lập.
  resendVerification = async ({ email }: { email: string }) => {
    const { data } = await authApi.post<BaseResponse<NeutralAck>>(
      `/auth/resend-verification`,
      { email },
    );
    return data.value;
  };

  // Yêu cầu đặt lại mật khẩu. Trả về thông điệp trung lập (không lộ email tồn tại hay không).
  forgotPassword = async ({ body }: { body: ForgotPasswordFormValues }) => {
    const { data } = await authApi.post<BaseResponse<NeutralAck>>(
      `/auth/forgot-password`,
      { email: body.email },
    );
    return data.value;
  };

  // Đặt lại mật khẩu bằng token + mật khẩu mới. Backend thu hồi mọi phiên sau khi đổi.
  resetPassword = async ({
    token,
    newPassword,
  }: {
    token: string;
    newPassword: string;
  }) => {
    const { data } = await authApi.post<BaseResponse<null>>(
      `/auth/reset-password`,
      { token, newPassword },
    );
    return data.value;
  };
}

const userService = new UserService();
export default userService;
