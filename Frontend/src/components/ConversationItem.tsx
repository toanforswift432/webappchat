import React from "react";
import { Conversation } from "../types";
import { format } from "date-fns";
import { useTranslation } from "../i18n/LanguageContext";
import { BellOff } from "lucide-react";
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}
export const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, isActive, onClick }) => {
  const { t } = useTranslation();
  const { user, lastMessage, unreadCount, isGroup, groupName, groupAvatar } = conversation;
  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return format(date, "HH:mm");
    }
    return format(date, "MMM d");
  };
  const displayName = isGroup ? groupName : user.name;
  const displayAvatar = isGroup ? groupAvatar : user.avatar;
  const renderLastMessage = () => {
    if (!lastMessage) return "";
    if (lastMessage.isRecalled) return "🚫 Tin nhắn đã được thu hồi";
    switch (lastMessage.type) {
      case "image":
        return "🖼️ " + (t("chat.image") || "Hình ảnh");
      case "file":
        return "📎 " + (lastMessage.fileName || t("chat.file") || "File");
      case "sticker":
        return "😊 Sticker";
      case "poll":
        return "📊 Cuộc thăm dò";
      case "system":
        return lastMessage.content ?? "";
      default:
        return lastMessage.content ?? "";
    }
  };
  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer transition-colors duration-200 ${isActive ? "bg-primary-light dark:bg-primary-dark-light" : "hover:bg-gray-100 dark:hover:bg-gray-800/50"}`}
    >
      <div className="relative flex-shrink-0">
        <img
          src={displayAvatar}
          alt={displayName}
          className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
        />

        {!isGroup && user.status !== 0 && (
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-900 rounded-full ${
              user.status === 1
                ? "bg-green-500" // Online
                : user.status === 2
                  ? "bg-yellow-500" // Away
                  : user.status === 3
                    ? "bg-purple-500" // InMeeting
                    : user.status === 4
                      ? "bg-blue-500"
                      : "bg-gray-400" // WorkFromHome : Offline
            }`}
          ></div>
        )}
      </div>

      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <h3
              className={`text-sm font-semibold truncate ${isActive ? "text-primary dark:text-blue-400" : "text-gray-900 dark:text-gray-100"}`}
            >
              {displayName}
            </h3>
            {conversation.isMuted && (
              <BellOff className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
            {formatTime(lastMessage?.timestamp)}
          </span>
        </div>

        <div className="flex justify-between items-center mt-1 min-w-0">
          <p
            className={`text-sm truncate min-w-0 flex-1 ${unreadCount > 0 ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}
          >
            {renderLastMessage()}
          </p>
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
