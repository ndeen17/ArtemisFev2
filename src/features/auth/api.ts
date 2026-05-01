import type {
  AuthResponse,
  AuthUser,
  ForgotPasswordInput,
  GoogleAuthInput,
  ResendVerificationInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
  VerifyEmailInput,
} from '@artemis/shared';
import { apiClient } from '@/lib/apiClient';

/** Typed wrappers around /auth endpoints. All consume @artemis/shared schemas. */
export const authApi = {
  async signUp(input: SignUpInput): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/signup', input);
    return res.data;
  },
  async signIn(input: SignInInput): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/signin', input);
    return res.data;
  },
  async google(input: GoogleAuthInput): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/google', input);
    return res.data;
  },
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
  async me(): Promise<{ user: AuthUser }> {
    const res = await apiClient.get<{ user: AuthUser }>('/auth/me');
    return res.data;
  },
  async verifyEmail(input: VerifyEmailInput): Promise<{ ok: true }> {
    const res = await apiClient.post<{ ok: true }>('/auth/verify-email', input);
    return res.data;
  },
  async resendVerification(input: ResendVerificationInput): Promise<{ ok: true }> {
    const res = await apiClient.post<{ ok: true }>('/auth/resend-verification', input);
    return res.data;
  },
  async forgotPassword(input: ForgotPasswordInput): Promise<{ ok: true }> {
    const res = await apiClient.post<{ ok: true }>('/auth/forgot-password', input);
    return res.data;
  },
  async checkResetToken(token: string): Promise<{ valid: boolean }> {
    const res = await apiClient.get<{ valid: boolean }>(
      `/auth/reset-password/${encodeURIComponent(token)}/check`,
    );
    return res.data;
  },
  async resetPassword(input: ResetPasswordInput): Promise<{ ok: true }> {
    const res = await apiClient.post<{ ok: true }>('/auth/reset-password', input);
    return res.data;
  },
};
