export type MessageStatus = "sent" | "delivered" | "seen";
export type MessageType = "text" | "image" | "file" | "sticker" | "poll" | "system";

export interface Account {
  id: string;
  email: string;
  password: string;
  name: string;
  avatar: string;
  phone?: string;
  bio?: string;
  department?: string;
  createdAt: string;
}

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  timestamp: string;
}

export interface Contact {
  userId: string;
  addedAt: string;
  isFavorite?: boolean;
}

export type AppTab = "chat" | "contacts" | "profile" | "admin";

export interface AppNotification {
  id: string;
  type: "message" | "friend_request" | "mention" | "system";
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  relatedId?: string; // conversationId, requestId, etc.
  fromUserId?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  statusMessage?: string; // e.g., 'Busy', 'Away', 'In a meeting'
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string; // text content, image URL, or file URL
  fileName?: string;
  fileSize?: string;
  timestamp: string;
  status: MessageStatus;
  isPinned?: boolean;
  isForwarded?: boolean;
  isRecalled?: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
    type: MessageType;
  };
  reactions?: { emoji: string; userIds: string[] }[]; // array of reaction objects
  pollData?: {
    question: string;
    options: { id: string; text: string; votes: string[] }[];
  };
}

export interface Conversation {
  id: string;
  user: User; // For 1-on-1 chats, this represents the other user
  lastMessage?: Message;
  unreadCount: number;
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
  members?: User[];
  adminId?: string;
  isMuted?: boolean;
}
