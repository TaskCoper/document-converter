import authApi, { type BaseResponse } from "@/lib/auth/api";
import type { Me } from "./types";
import type { SignInFormValues } from "./validations";

class UserService {
  private readonly baseUrl = "users";

  signIn = async ({ body }: { body: SignInFormValues }) => {
    const { data } = await authApi.post<
      BaseResponse<{ accessToken: string; refreshToken: string }>
    >(`/v1/${this.baseUrl}/login`, body);
    return data.value;
  };

  signOut = async ({ email }: { email: string }) => {
    const { data } = await authApi.post<BaseResponse<string>>(
      `/v1/${this.baseUrl}/logout`,
      { email },
    );
    return data.value;
  };

  getMe = async () => {
    const { data } = await authApi.get<BaseResponse<Me>>(
      `/v1/${this.baseUrl}/me`,
    );
    return data.value;
  };
}

const userService = new UserService();
export default userService;
