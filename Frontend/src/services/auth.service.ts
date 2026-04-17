import api from './axios';
import type { AuthResponseDto } from '../types/api';

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponseDto>('/auth/login', { email, password }).then((r) => r.data),

  register: (email: string, password: string, displayName: string) =>
    api.post<AuthResponseDto>('/auth/register', { email, password, displayName }).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<AuthResponseDto>('/auth/refresh', { refreshToken }).then((r) => r.data),
};
