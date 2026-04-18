import React, { useEffect, useState, useRef } from "react";
import {
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Users,
  Pin,
  ChevronDown,
  ChevronUp,
  Search,
  Paperclip,
  Image as ImageIcon,
  Bell,
  BellOff,
  Ban,
  CircleSlash,
} from "lucide-react";
import { Conversation, Message, User } from "../types";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { ImagePreview } from "./ImagePreview";
import { GroupManageModal } from "./GroupManageModal";
import { SharedFilesPanel } from "./SharedFilesPanel";
import { MessageSearchPanel } from "./MessageSearchPanel";
import { CreatePollModal } from "./CreatePollModal";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useTranslation } from "../i18n/LanguageContext";
import { useCall } from "../hooks/useCall";
import { getSignalRConnection } from "../hooks/useSignalR";
import { conversationService } from "../services/conversation.service";
import { userService } from "../services/user.service";
import { MessageType } from "../types/api";
import { addRealTimeMessage, hideMessage as hideMessageAction } from "../store/slices/messageSlice";
interface ChatAreaProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  isTyping: boolean;
  onSendMessage: (
    content: string,
    type: "text" | "image" | "file" | "sticker" | "poll",
    fileData?: {
      name: string;
      size: string;
    },
    replyTo?: Message,
    pollData?: {
      question: string;
      options: {
        id: string;
        text: string;
        votes: string[];
      }[];
    },
  ) => void;
  onBack: () => void;
  onUpdateGroupMembers: (groupId: string, memberIds: string[]) => void;
  onRemoveGroup: (groupId: string) => void;
  onPinToggle: (msgId: string) => void;
  onReact: (msgId: string, emoji: string) => void;
  onForward: (msg: Message) => void;
  onRecall: (msgId: string) => void;
  onVote: (msgId: string, optionId: string) => void;
}
export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  currentUserId,
  isTyping,
  onSendMessage,
  onBack,
  onUpdateGroupMembers,
  onRemoveGroup,
  onPinToggle,
  onReact,
  onForward,
  onRecall,
  onVote,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const friends = useAppSelector((s) => s.friends.friends);
  const conversationMembers = conversation.members ?? [];
  const users: Record<string, User> = {};
  [...friends, ...conversationMembers, conversation.user].forEach((u) => {
    if (u && "id" in u) users[u.id] = u as User;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showAllPinned, setShowAllPinned] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSharedFilesOpen, setIsSharedFilesOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(conversation.isMuted || false);
  const [isBlocked, setIsBlocked] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const hiddenIds = useAppSelector((s) => s.messages.hiddenIds);
  const visibleMessages = messages.filter((m) => !hiddenIds.includes(m.id));
  const pinnedMessages = visibleMessages.filter((m) => m.isPinned);
  const handleDeleteForMe = (msgId: string) => dispatch(hideMessageAction(msgId));

  // Call functionality
  const { initiateCall } = useCall();

  const handleStartAudioCall = () => {
    initiateCall(conversation.id, "audio");
  };

  const handleStartVideoCall = () => {
    initiateCall(conversation.id, "video");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };
  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update muted state when conversation changes
  useEffect(() => {
    setIsMuted(conversation.isMuted || false);
  }, [conversation.isMuted]);

  const handleToggleMute = async () => {
    try {
      await conversationService.muteConversation(conversation.id, !isMuted);
      setIsMuted(!isMuted);
      setShowOptionsMenu(false);
    } catch (error) {
      console.error("Failed to toggle mute:", error);
      alert("Failed to toggle mute. Please try again.");
    }
  };

  const handleToggleBlock = async () => {
    if (conversation.isGroup) return; // Can't block in groups
    try {
      if (isBlocked) {
        await userService.unblockUser(conversation.user.id);
      } else {
        if (!window.confirm("Are you sure you want to block this user?")) {
          return;
        }
        await userService.blockUser(conversation.user.id);
      }
      setIsBlocked(!isBlocked);
      setShowOptionsMenu(false);
    } catch (error) {
      console.error("Failed to toggle block:", error);
      alert("Failed to toggle block. Please try again.");
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set to false if leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Show preview for images before uploading
    if (file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
      return;
    }

    // Upload non-image files immediately
    try {
      setIsUploading(true);
      const messageDto = await conversationService.uploadAndSend(conversation.id, file, MessageType.File);
      // Dispatch immediately for instant display
      dispatch(addRealTimeMessage({ dto: messageDto, currentUserId }));
      setReplyingTo(null);
    } catch (error) {
      console.error("Upload failed:", error);
      alert(t("chat.uploadFailed") || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
  const handleSendMessage = (
    content: string,
    type: "text" | "image" | "file" | "sticker" | "poll",
    fileData?: {
      name: string;
      size: string;
    },
    pollData?: {
      question: string;
      options: {
        id: string;
        text: string;
        votes: string[];
      }[];
    },
  ) => {
    onSendMessage(content, type, fileData, replyingTo || undefined, pollData);
    setReplyingTo(null);
  };
  const handleCreatePoll = (question: string, options: string[]) => {
    const pollData = {
      question,
      options: options.map((opt, index) => ({
        id: `opt-${Date.now()}-${index}`,
        text: opt,
        votes: [],
      })),
    };
    handleSendMessage("Poll", "poll", undefined, pollData);
  };
  const displayName = conversation.isGroup ? conversation.groupName : conversation.user.name;
  const displayAvatar = conversation.isGroup ? conversation.groupAvatar : conversation.user.avatar;
  const displayStatus = conversation.isGroup
    ? `${conversation.members?.length || 0} members`
    : conversation.user.isOnline
      ? "Active now"
      : "Offline";
  return (
    <div
      className="flex-1 flex flex-col h-full bg-[#e5e7eb] dark:bg-gray-800 relative w-full transition-colors duration-200"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="h-16 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-sm z-10 transition-colors duration-200">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="md:hidden mr-3 p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative">
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
            />

            {!conversation.isGroup && conversation.user.isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            )}
          </div>
          <div className="ml-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{displayName}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{displayStatus}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {conversation.isGroup && (
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors"
              title="Manage Group"
            >
              <Users className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            title={t("common.search")}
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsSharedFilesOpen(true)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors hidden sm:block"
            title={t("sharedFiles.title")}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            onClick={handleStartAudioCall}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors hidden sm:block"
            title="Start audio call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={handleStartVideoCall}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors hidden sm:block"
            title="Start video call"
          >
            <Video className="w-5 h-5" />
          </button>
          <div className="relative" ref={optionsMenuRef}>
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showOptionsMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                <button
                  onClick={handleToggleMute}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                >
                  {isMuted ? (
                    <>
                      <Bell className="w-4 h-4" />
                      <span>Unmute notifications</span>
                    </>
                  ) : (
                    <>
                      <BellOff className="w-4 h-4" />
                      <span>Mute notifications</span>
                    </>
                  )}
                </button>
                {!conversation.isGroup && (
                  <button
                    onClick={handleToggleBlock}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                  >
                    {isBlocked ? (
                      <>
                        <CircleSlash className="w-4 h-4" />
                        <span>Unblock user</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" />
                        <span>Block user</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <MessageSearchPanel
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        conversationId={conversation.id}
      />

      {/* Pinned Messages Bar */}
      {pinnedMessages.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-10 transition-colors duration-200">
          <div
            className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            onClick={() => setShowAllPinned(!showAllPinned)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Pin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {pinnedMessages.length}{" "}
                {pinnedMessages.length === 1 ? t("chat.pinnedMessage") : t("chat.pinnedMessages_plural")}
              </span>
            </div>
            <button
              onClick={() => setShowAllPinned(!showAllPinned)}
              className="text-xs text-primary hover:underline flex items-center"
            >
              {showAllPinned ? t("chat.showLess") : t("chat.showAll")}
              {showAllPinned ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </button>
          </div>

          {showAllPinned && (
            <div className="max-h-40 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
              {pinnedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-start group transition-colors"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {users[msg.senderId]?.name || "Unknown"}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{msg.content}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPinToggle(msg.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-all"
                  >
                    Unpin
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#f3f4f6] dark:bg-gray-800 transition-colors duration-200">
        <div className="max-w-4xl mx-auto flex flex-col">
          {visibleMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUserId}
              users={users}
              onReply={setReplyingTo}
              onPinToggle={onPinToggle}
              onReact={onReact}
              onForward={onForward}
              onRecall={onRecall}
              onVote={onVote}
              onDelete={handleDeleteForMe}
              currentUserId={currentUserId}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput
        conversation={conversation}
        onSendMessage={handleSendMessage}
        onImageSelect={(url) => {
          setPreviewImage(url);
        }}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        isGroup={conversation.isGroup}
        onCreatePoll={() => setIsCreatePollOpen(true)}
        members={conversation.isGroup ? conversation.members : undefined}
        onTyping={(isTyping) => {
          getSignalRConnection()?.invoke("Typing", conversation.id, isTyping);
        }}
      />

      {/* Image Preview Modal */}
      <ImagePreview
        isOpen={!!previewImage}
        imageUrl={previewImage}
        onClose={() => {
          setPreviewImage(null);
          // Clean up blob URL
          if (previewImage?.startsWith("blob:")) {
            URL.revokeObjectURL(previewImage);
          }
          // Clear pending file
          delete (window as any).__pendingImageFile;
        }}
        onSend={async () => {
          if (previewImage) {
            const file = (window as any).__pendingImageFile;
            if (file) {
              try {
                setIsUploading(true);
                const messageDto = await conversationService.uploadAndSend(conversation.id, file, MessageType.Image);
                // Dispatch immediately for instant display
                dispatch(addRealTimeMessage({ dto: messageDto, currentUserId }));
                // Clean up
                URL.revokeObjectURL(previewImage);
                delete (window as any).__pendingImageFile;
                setPreviewImage(null);
                setReplyingTo(null);
              } catch (error) {
                console.error("Upload failed:", error);
                alert(t("chat.uploadFailed") || "Upload failed. Please try again.");
              } finally {
                setIsUploading(false);
              }
            } else {
              // Fallback: use blob URL if no file (shouldn't happen)
              onSendMessage(previewImage, "image");
              setPreviewImage(null);
            }
          }
        }}
      />

      {/* Group Manage Modal */}
      {conversation.isGroup && (
        <GroupManageModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          group={conversation}
          currentUserId={currentUserId}
          onUpdateMembers={(memberIds) => onUpdateGroupMembers(conversation.id, memberIds)}
          onRemoveGroup={() => onRemoveGroup(conversation.id)}
        />
      )}

      <SharedFilesPanel isOpen={isSharedFilesOpen} onClose={() => setIsSharedFilesOpen(false)} messages={messages} />

      <CreatePollModal
        isOpen={isCreatePollOpen}
        onClose={() => setIsCreatePollOpen(false)}
        onCreate={handleCreatePoll}
      />

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 dark:bg-primary/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 border-4 border-dashed border-primary dark:border-primary-light">
            <ImageIcon className="w-16 h-16 text-primary dark:text-primary-light" />
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t("chat.dropImageHere") || "Thả ảnh vào đây"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("chat.supportedFormats") || "Hỗ trợ: JPG, PNG, GIF"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("chat.uploading") || "Đang tải lên..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
