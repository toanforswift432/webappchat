import api from './axios';
import type { ConversationDto, MessageDto } from '../types/api';
import { MessageType } from '../types/api';

export const conversationService = {
  getAll: () => api.get<ConversationDto[]>('/conversations').then((r) => r.data),

  getOrCreateDirect: (otherUserId: string) =>
    api.post<ConversationDto>('/conversations/direct', { otherUserId }).then((r) => r.data),

  createGroup: (name: string, memberIds: string[]) =>
    api.post<ConversationDto>('/conversations/group', { name, memberIds }).then((r) => r.data),

  getMessages: (conversationId: string, page = 1, pageSize = 50) =>
    api
      .get<MessageDto[]>(`/conversations/${conversationId}/messages`, { params: { page, pageSize } })
      .then((r) => r.data),

  sendMessage: (
    conversationId: string,
    type: MessageType,
    content: string | null,
    options?: { fileUrl?: string; fileName?: string; fileSize?: number; replyToMessageId?: string }
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
    form.append('file', file);
    return api
      .post<MessageDto>(`/conversations/${conversationId}/messages/upload?type=${type}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  recallMessage: (conversationId: string, messageId: string) =>
    api.delete(`/conversations/${conversationId}/messages/${messageId}`),
};
