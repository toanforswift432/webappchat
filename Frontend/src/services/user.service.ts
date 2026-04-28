import api from "./axios";
import type { UserDto, NotificationSettingsDto, ColleagueDto, UserSearchResultDto } from "../types/api";
import { OnlineStatus } from "../types/api";

export const userService = {
  getMe: () => api.get<UserDto>("/users/me").then((r) => r.data),

  updateMe: (displayName: string, avatarUrl?: string) =>
    api.put<UserDto>("/users/me", { displayName, avatarUrl }).then((r) => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<{ avatarUrl: string }>("/users/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.avatarUrl);
  },

  updateStatus: (status: OnlineStatus) => api.put("/users/me/status", { status }).then((r) => r.data),

  updateNotifications: (settings: NotificationSettingsDto) =>
    api.put("/users/me/notifications", settings).then((r) => r.data),

  search: (q: string) => api.get<UserSearchResultDto[]>(`/users/search?q=${encodeURIComponent(q)}`).then((r) => r.data),

  blockUser: (userId: string) => api.post(`/users/${userId}/block`).then((r) => r.data),

  unblockUser: (userId: string) => api.delete(`/users/${userId}/block`).then((r) => r.data),

  getBlockedUsers: () => api.get<UserDto[]>("/users/blocked").then((r) => r.data),

  getColleagues: () => api.get<ColleagueDto[]>("/users/colleagues").then((r) => r.data),
};
