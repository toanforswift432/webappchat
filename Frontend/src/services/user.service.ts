import api from './axios';
import type { UserDto } from '../types/api';
import { OnlineStatus } from '../types/api';

export const userService = {
  getMe: () => api.get<UserDto>('/users/me').then((r) => r.data),

  updateMe: (displayName: string, avatarUrl?: string) =>
    api.put<UserDto>('/users/me', { displayName, avatarUrl }).then((r) => r.data),

  updateStatus: (status: OnlineStatus) =>
    api.put('/users/me/status', { status }).then((r) => r.data),

  search: (q: string) => api.get<UserDto[]>(`/users/search?q=${encodeURIComponent(q)}`).then((r) => r.data),
};
