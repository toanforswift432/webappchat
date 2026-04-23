import api from "./axios";
import type {
  AuthResponseDto,
  RegisterResponseDto,
  VerifyOtpResponseDto,
  PendingEmployeeDto,
  ResendOtpResponseDto,
} from "../types/api";

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponseDto>("/auth/login", { email, password }).then((r) => r.data),

  registerCustomer: (email: string, password: string, displayName: string, phoneNumber: string) =>
    api
      .post<RegisterResponseDto>("/auth/register/customer", { email, password, displayName, phoneNumber })
      .then((r) => r.data),

  registerEmployee: (inviteCode: string, email: string, password: string, displayName: string, phoneNumber: string) =>
    api
      .post<RegisterResponseDto>(`/auth/register/employee/${inviteCode}`, { email, password, displayName, phoneNumber })
      .then((r) => r.data),

  verifyOtp: (emailOrPhone: string, otpCode: string) =>
    api.post<VerifyOtpResponseDto>("/auth/verify-otp", { emailOrPhone, otpCode }).then((r) => r.data),

  resendOtp: (emailOrPhone: string) =>
    api.post<ResendOtpResponseDto>("/auth/resend-otp", { emailOrPhone }).then((r) => r.data),

  refresh: (refreshToken: string) => api.post<AuthResponseDto>("/auth/refresh", { refreshToken }).then((r) => r.data),

  // Admin endpoints
  getPendingAccounts: () => api.get<PendingEmployeeDto[]>("/admin/pending-accounts").then((r) => r.data),

  approveAccount: (userId: string, approve: boolean) =>
    api.post(`/admin/accounts/${userId}/approve`, { approve }).then((r) => r.data),
};
