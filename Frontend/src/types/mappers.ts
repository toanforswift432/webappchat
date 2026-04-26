import { User, Message, Conversation, MessageType as UIMessageType } from "../types";
import { UserDto, MessageDto, ConversationDto, OnlineStatus, MessageType, ConversationType } from "./api";
import { BASE_URL } from "../config";

// Resolve any file/avatar URL to an absolute URL that works on any environment.
// Handles three cases:
//   1. Relative path  "/uploads/..."  → prepend BASE_URL
//   2. Legacy absolute "http://localhost:5054/uploads/..." → rewrite to BASE_URL + path
//   3. External URL   "https://..."   → use as-is
function resolveUrl(url: string): string {
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url)) {
    try {
      return `${BASE_URL}${new URL(url).pathname}`;
    } catch {
      return url;
    }
  }
  return url;
}

export function avatarUrl(dto: { displayName: string; avatarUrl: string | null }): string {
  if (dto.avatarUrl) return resolveUrl(dto.avatarUrl);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(dto.displayName)}&background=6366f1&color=fff`;
}

function statusLabel(status: OnlineStatus): string | undefined {
  switch (status) {
    case OnlineStatus.Away:
      return "Away";
    case OnlineStatus.InMeeting:
      return "In a meeting";
    case OnlineStatus.WorkFromHome:
      return "Working from home";
    default:
      return undefined;
  }
}

export function mapUser(dto: UserDto): User {
  return {
    id: dto.id,
    name: dto.displayName,
    avatar: avatarUrl(dto),
    isOnline: dto.status === OnlineStatus.Online,
    status: dto.status,
    statusMessage: statusLabel(dto.status),
  };
}

function mapMessageType(type: MessageType): UIMessageType {
  switch (type) {
    case MessageType.Image:
      return "image";
    case MessageType.File:
      return "file";
    case MessageType.Sticker:
      return "sticker";
    case MessageType.Poll:
      return "poll";
    case MessageType.System:
      return "system";
    default:
      return "text";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function mapMessage(dto: MessageDto): Message {
  // DO NOT resolve fileUrl - keep it as relative path for download API
  // Only resolve for display purposes (images)
  const fileUrl = dto.fileUrl || null;
  const content = dto.content ?? fileUrl ?? "";
  return {
    id: dto.id,
    conversationId: dto.conversationId,
    senderId: dto.senderId ?? "",
    type: mapMessageType(dto.type),
    content,
    fileName: dto.fileName ?? undefined,
    fileSize: dto.fileSize ? formatFileSize(dto.fileSize) : undefined,
    timestamp: dto.createdAt,
    status: "sent",
    isPinned: dto.isPinned,
    isRecalled: dto.isRecalled,
    reactions: (dto.reactions?.length ?? 0) > 0 ? dto.reactions : undefined,
    isForwarded: dto.isForwarded || undefined,
    forwardedFromMessageId: dto.forwardedFromMessageId?.toString() || undefined,
    originalSenderName: dto.originalSenderName || undefined,
    replyTo: dto.replyToMessageId
      ? {
          id: dto.replyToMessageId,
          senderName: dto.replyToSenderName ?? "",
          content: dto.replyToContent ?? null,
          type: dto.replyToType != null ? mapMessageType(dto.replyToType) : "text",
        }
      : undefined,
  };
}

export function mapConversation(dto: ConversationDto, currentUserId: string): Conversation {
  const isGroup = dto.type === ConversationType.Group;
  const otherMember = dto.members.find((m) => m.userId !== currentUserId) ?? dto.members[0];
  const otherUser: User = otherMember
    ? {
        id: otherMember.userId,
        name: otherMember.displayName,
        avatar: avatarUrl(otherMember),
        isOnline: otherMember.status === OnlineStatus.Online,
        status: otherMember.status,
      }
    : { id: "", name: "Unknown", avatar: "", isOnline: false, status: 0 };

  const members: User[] = dto.members.map((m) => ({
    id: m.userId,
    name: m.displayName,
    avatar: avatarUrl(m),
    isOnline: m.status === OnlineStatus.Online,
    status: m.status,
  }));

  const adminMember = dto.members.find((m) => m.role === 1);

  return {
    id: dto.id,
    user: isGroup
      ? {
          id: dto.id,
          name: dto.name ?? "Group",
          avatar: avatarUrl({ displayName: dto.name ?? "G", avatarUrl: dto.avatarUrl }),
          isOnline: false,
          status: 0,
        }
      : otherUser,
    lastMessage: dto.lastMessage ? mapMessage(dto.lastMessage) : undefined,
    unreadCount: dto.unreadCount,
    isGroup,
    groupName: isGroup ? (dto.name ?? undefined) : undefined,
    groupAvatar: isGroup && dto.avatarUrl ? resolveUrl(dto.avatarUrl) : undefined,
    members: isGroup ? members : undefined,
    adminId: adminMember?.userId,
    isMuted: dto.isMuted,
  };
}
