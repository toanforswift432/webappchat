import api from "./axios";
import type { UserDto, FriendRequestDto } from "../types/api";

export const friendService = {
  getFriends: () => api.get<UserDto[]>("/friends").then((r) => r.data),

  getRequests: () => api.get<FriendRequestDto[]>("/friends/requests").then((r) => r.data),

  sendRequest: (toUserId: string) => api.post("/friends/request", { toUserId }),

  acceptRequest: (requestId: string) => api.post(`/friends/request/${requestId}/accept`),

  rejectRequest: (requestId: string) => api.post(`/friends/request/${requestId}/reject`),

  unfriend: (friendId: string) => api.delete(`/friends/${friendId}`),
};
