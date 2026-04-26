import api from "./axios";
import type { ConversationDto, MessageDto } from "../types/api";
import { MessageType } from "../types/api";

export const conversationService = {
  getAll: () => api.get<ConversationDto[]>("/conversations").then((r) => r.data),

  getOrCreateDirect: (otherUserId: string) =>
    api.post<ConversationDto>("/conversations/direct", { otherUserId }).then((r) => r.data),

  createGroup: (name: string, memberIds: string[]) =>
    api.post<ConversationDto>("/conversations/group", { name, memberIds }).then((r) => r.data),

  uploadGroupAvatar: (conversationId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<{ avatarUrl: string }>(`/conversations/${conversationId}/avatar`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.avatarUrl);
  },

  getMessages: (conversationId: string, page = 1, pageSize = 50) =>
    api
      .get<MessageDto[]>(`/conversations/${conversationId}/messages`, { params: { page, pageSize } })
      .then((r) => r.data),

  sendMessage: (
    conversationId: string,
    type: MessageType,
    content: string | null,
    options?: { fileUrl?: string; fileName?: string; fileSize?: number; replyToMessageId?: string },
  ) =>
    api
      .post<MessageDto>(`/conversations/${conversationId}/messages`, {
        type,
        content,
        fileUrl: options?.fileUrl,
        fileName: options?.fileName,
        fileSize: options?.fileSize,
        replyToMessageId: options?.replyToMessageId,
      })
      .then((r) => r.data),

  uploadAndSend: (conversationId: string, file: File, type: MessageType = MessageType.File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<MessageDto>(`/conversations/${conversationId}/messages/upload?type=${type}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  recallMessage: (conversationId: string, messageId: string) =>
    api.delete(`/conversations/${conversationId}/messages/${messageId}`),

  deleteMessage: (conversationId: string, messageId: string) =>
    api.delete(`/conversations/${conversationId}/messages/${messageId}/permanent`),

  deleteForMeMessage: (conversationId: string, messageId: string) =>
    api.delete(`/conversations/${conversationId}/messages/${messageId}/for-me`),

  forwardMessage: (conversationId: string, messageId: string, targetConversationId: string) =>
    api.post(`/conversations/${conversationId}/messages/${messageId}/forward`, { targetConversationId }),

  pinMessage: (conversationId: string, messageId: string) =>
    api
      .put<{ isPinned: boolean }>(`/conversations/${conversationId}/messages/${messageId}/pin`)
      .then((r) => r.data),

  toggleReaction: (conversationId: string, messageId: string, emoji: string) =>
    api
      .post<{ added: boolean }>(`/conversations/${conversationId}/messages/${messageId}/react`, { emoji })
      .then((r) => r.data),

  muteConversation: (conversationId: string, mute: boolean) =>
    api.put(`/conversations/${conversationId}/mute`, { mute }).then((r) => r.data),

  renameGroup: (conversationId: string, name: string) => api.patch(`/conversations/${conversationId}/name`, { name }),

  leaveGroup: (conversationId: string) => api.post(`/conversations/${conversationId}/leave`),

  kickMember: (conversationId: string, userId: string) =>
    api.delete(`/conversations/${conversationId}/members/${userId}`),

  addMember: (conversationId: string, userId: string) =>
    api.post(`/conversations/${conversationId}/members`, { userId }),
};
