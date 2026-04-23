export enum OnlineStatus {
  Offline = 0,
  Online = 1,
  Away = 2,
  InMeeting = 3,
  WorkFromHome = 4,
}

export enum AccountType {
  Customer = 0,
  Employee = 1,
  Admin = 2,
}

export enum ApprovalStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export enum ConversationType {
  Direct = 0,
  Group = 1,
}

export enum MessageType {
  Text = 0,
  Image = 1,
  File = 2,
  Poll = 3,
  Sticker = 4,
  System = 5,
}

export enum MemberRole {
  Member = 0,
  Admin = 1,
}

export interface NotificationSettingsDto {
  sound: boolean;
  messages: boolean;
  groups: boolean;
  mentions: boolean;
  preview: boolean;
  messageSoundType?: string;
  callSoundType?: string;
}

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  status: OnlineStatus;
  lastSeenAt: string | null;
  accountType: AccountType;
  approvalStatus: ApprovalStatus;
  isVerified: boolean;
  notificationSettings: NotificationSettingsDto;
}

export interface RegisterResponseDto {
  message: string;
  otpCode: string | null; // chỉ có khi dev/test
}

export interface ResendOtpResponseDto {
  message: string;
  maskedEmail: string;
  otpCode?: string; // Chỉ có khi dev/test
}

export interface VerifyOtpResponseDto {
  message: string;
  requiresApproval: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: UserDto | null;
}

export interface PendingEmployeeDto {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string | null;
  createdAt: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface ReactionDto {
  emoji: string;
  userIds: string[];
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderName: string;
  senderAvatar: string | null;
  type: MessageType;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  replyToMessageId: string | null;
  isRecalled: boolean;
  isPinned: boolean;
  reactions: ReactionDto[];
  createdAt: string;
}

export interface ConversationMemberDto {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: MemberRole;
  status: OnlineStatus;
}

export interface ConversationDto {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  type: ConversationType;
  members: ConversationMemberDto[];
  lastMessage: MessageDto | null;
  unreadCount: number;
  createdAt: string;
  isMuted: boolean;
}

export interface FriendRequestDto {
  id: string;
  fromUser: UserDto;
  createdAt: string;
}
