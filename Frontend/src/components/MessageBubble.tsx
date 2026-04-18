import React, { useState, lazy } from "react";
import { Message, User } from "../types";
import { format } from "date-fns";
import {
  Check,
  CheckCheck,
  FileText,
  Download,
  Reply,
  Pin,
  Smile,
  Forward,
  Undo2,
  Trash2,
  Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "../i18n/LanguageContext";
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  users: Record<string, User>;
  onReply?: (msg: Message) => void;
  onPinToggle?: (msgId: string) => void;
  onReact?: (msgId: string, emoji: string) => void;
  onForward?: (msg: Message) => void;
  onRecall?: (msgId: string) => void;
  onVote?: (msgId: string, optionId: string) => void;
  onDelete?: (msgId: string) => void;
  currentUserId: string;
}
const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  users,
  onReply,
  onPinToggle,
  onReact,
  onForward,
  onRecall,
  onVote,
  onDelete,
  currentUserId,
}) => {
  const { t } = useTranslation();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const timeString = format(new Date(message.timestamp), "HH:mm");
  const sender = users[message.senderId];
  const renderStatus = () => {
    if (!isOwn) return null;
    switch (message.status) {
      case "sent":
        return <Check className="w-3 h-3 text-gray-300 dark:text-gray-400 ml-1" />;

      case "delivered":
        return <CheckCheck className="w-3 h-3 text-gray-300 dark:text-gray-400 ml-1" />;

      case "seen":
        return <CheckCheck className="w-3 h-3 text-blue-200 dark:text-blue-300 ml-1" />;

      default:
        return null;
    }
  };
  const renderReplyBlock = () => {
    if (!message.replyTo) return null;
    return (
      <div
        className={`mb-2 p-2 rounded border-l-4 text-xs cursor-pointer opacity-90 transition-colors
          ${isOwn ? "bg-white/20 border-white text-white" : "bg-gray-100 dark:bg-gray-600 border-primary text-gray-700 dark:text-gray-200"}
        `}
      >
        <div className="font-semibold mb-0.5">{message.replyTo.senderName}</div>
        <div className="truncate opacity-80">
          {message.replyTo.type === "image"
            ? t("chat.image")
            : message.replyTo.type === "file"
              ? t("chat.file")
              : message.replyTo.content}
        </div>
      </div>
    );
  };
  const renderTextWithMentions = (text: string) => {
    if (!text) return null;
    // Simple regex to find @Name patterns
    const parts = text.split(/(@\w+(?:\s\w+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        // Check if the name matches any user (case insensitive)
        const name = part.substring(1).toLowerCase();
        const isUser = Object.values(users).some((u) => u.name.toLowerCase() === name);
        if (isUser) {
          return (
            <span
              key={i}
              className={`font-semibold ${isOwn ? "text-white underline decoration-white/50" : "text-primary bg-primary/10 px-1 rounded"}`}
            >
              {part}
            </span>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };
  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;
    return (
      <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
        {message.reactions.map((reaction) => {
          const hasReacted = reaction.userIds.includes(currentUserId);
          return (
            <button
              key={reaction.emoji}
              onClick={() => onReact?.(message.id, reaction.emoji)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white dark:bg-gray-700 border shadow-sm dark:shadow-none transition-colors
                ${hasReacted ? "border-primary bg-primary-light dark:bg-primary-dark-light text-primary dark:text-blue-400" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}
              `}
              title={reaction.userIds.map((id) => users[id]?.name || id).join(", ")}
            >
              <span>{reaction.emoji}</span>
              <span className="font-medium">{reaction.userIds.length}</span>
            </button>
          );
        })}
      </div>
    );
  };
  const renderContent = () => {
    if (message.isRecalled) {
      return (
        <span className="italic opacity-70">{isOwn ? t("chat.youUnsent") : `${sender?.name} ${t("chat.unsent")}`}</span>
      );
    }
    switch (message.type) {
      case "text":
        return <p className="whitespace-pre-wrap break-words">{renderTextWithMentions(message.content)}</p>;

      case "image":
        return (
          <div className="relative group/img cursor-pointer">
            <img
              src={message.content}
              alt="Attached"
              className="max-w-full sm:max-w-xs h-auto object-cover rounded-md"
              loading="lazy"
            />
          </div>
        );

      case "file":
        return (
          <div
            className={`flex items-center p-2 rounded-md mt-1 mb-1 transition-colors ${isOwn ? "bg-primary-hover" : "bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500"}`}
          >
            <div className={`p-2 rounded-full ${isOwn ? "bg-white/20" : "bg-gray-100 dark:bg-gray-700"}`}>
              <FileText className={`w-6 h-6 ${isOwn ? "text-white" : "text-gray-600 dark:text-gray-300"}`} />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.fileName || "Document"}</p>
              <p className={`text-xs ${isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                {message.fileSize || "Unknown size"}
              </p>
            </div>
            <button className={`ml-2 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors`}>
              <Download className={`w-4 h-4 ${isOwn ? "text-white" : "text-gray-600 dark:text-gray-300"}`} />
            </button>
          </div>
        );

      case "sticker":
        return (
          <div className="mt-1 mb-1">
            <img
              src={message.content}
              alt="Sticker"
              className="w-32 h-32 object-contain drop-shadow-md"
              loading="lazy"
            />
          </div>
        );

      case "poll":
        if (!message.pollData) return null;
        const totalVotes = message.pollData.options.reduce((sum, opt) => sum + opt.votes.length, 0);
        return (
          <div className="mt-1 mb-1 w-full sm:w-64">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold">{message.pollData.question}</span>
            </div>
            <div className="space-y-2">
              {message.pollData.options.map((opt) => {
                const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100);
                const hasVoted = opt.votes.includes(currentUserId);
                return (
                  <div
                    key={opt.id}
                    onClick={() => onVote?.(message.id, opt.id)}
                    className={`relative overflow-hidden rounded-lg border p-2 cursor-pointer transition-colors
                      ${isOwn ? (hasVoted ? "border-white bg-white/20" : "border-blue-300 hover:bg-white/10") : hasVoted ? "border-primary bg-primary-light dark:bg-primary-dark-light" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"}
                    `}
                  >
                    {/* Progress Bar Background */}
                    <div
                      className={`absolute inset-y-0 left-0 opacity-20 ${isOwn ? "bg-white" : "bg-primary"}`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />

                    <div className="relative flex justify-between items-center text-sm z-10">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors
                          ${isOwn ? (hasVoted ? "border-white bg-white" : "border-blue-200") : hasVoted ? "border-primary bg-primary" : "border-gray-300 dark:border-gray-500"}
                        `}
                        >
                          {hasVoted && <Check className={`w-3 h-3 ${isOwn ? "text-primary" : "text-white"}`} />}
                        </div>
                        <span className={hasVoted ? "font-medium" : ""}>{opt.text}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs opacity-80">
                        {opt.votes.length > 0 && (
                          <div className="flex -space-x-1 mr-1">
                            {opt.votes.slice(0, 3).map((vId, i) => (
                              <img
                                key={i}
                                src={users[vId]?.avatar}
                                className="w-4 h-4 rounded-full border border-white dark:border-gray-700"
                              />
                            ))}
                          </div>
                        )}
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {opt.votes.length} {t("chat.votes")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={`text-xs mt-2 opacity-70 ${isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
              {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  if (message.type === "system") {
    return (
      <div className="flex justify-center my-3">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
            {message.content}
          </span>
          <span className="text-[10px] text-gray-300 dark:text-gray-600">
            {format(new Date(message.timestamp), "HH:mm · dd/MM/yyyy")}
          </span>
        </div>
      </div>
    );
  }

  const isSticker = message.type === "sticker";
  const bubbleClasses = isSticker
    ? "relative" // No background for stickers
    : `relative px-4 py-2 transition-colors ${isOwn ? "bg-primary text-white rounded-2xl rounded-tr-sm" : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-600"}`;
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className={`flex w-full mb-4 ${isOwn ? "justify-end" : "justify-start"} relative group`}
    >
      {!isOwn && sender && (
        <img
          src={sender.avatar}
          alt={sender.name}
          className="w-8 h-8 rounded-full mr-2 self-end mb-1 object-cover border border-gray-200 dark:border-gray-700"
        />
      )}

      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[75%] md:max-w-[65%]`}>
        {!isOwn && sender && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 mb-1">{sender.name}</span>}

        <div className="relative flex items-center">
          {/* Actions for Own Messages (Left side) — CSS group-hover, no JS gap issue */}
          {isOwn && !message.isRecalled && (
            <div className="absolute right-full mr-2 flex items-center gap-1 bg-white dark:bg-gray-700 shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-600 rounded-lg p-1 transition-all duration-150 invisible opacity-0 group-hover:visible group-hover:opacity-100 z-10">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 hover:bg-primary-light dark:hover:bg-gray-600 rounded transition-colors"
              >
                <Smile className="w-4 h-4" />
              </button>
              <button
                onClick={() => onReply?.(message)}
                className="p-1.5 text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 hover:bg-primary-light dark:hover:bg-gray-600 rounded transition-colors"
              >
                <Reply className="w-4 h-4" />
              </button>
              <button
                onClick={() => onForward?.(message)}
                className="p-1.5 text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 hover:bg-primary-light dark:hover:bg-gray-600 rounded transition-colors"
              >
                <Forward className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPinToggle?.(message.id)}
                className={`p-1.5 rounded transition-colors ${message.isPinned ? "text-primary dark:text-blue-400 bg-primary-light dark:bg-gray-600" : "text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 hover:bg-primary-light dark:hover:bg-gray-600"}`}
              >
                <Pin className="w-4 h-4" />
              </button>
              {message.type === "text" && (
                <button
                  onClick={() => { navigator.clipboard.writeText(message.content); }}
                  className="p-1.5 text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 hover:bg-primary-light dark:hover:bg-gray-600 rounded transition-colors"
                  title="Sao chép"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onRecall?.(message.id)}
                className="p-1.5 text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-600 rounded transition-colors"
                title="Thu hồi"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete?.(message.id)}
                className="p-1.5 text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-600 rounded transition-colors"
                title="Xóa phía mình"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className={bubbleClasses}>
            {message.isPinned && !message.isRecalled && (
              <div
                className={`absolute -top-2 ${isOwn ? "-right-2" : "-left-2"} bg-yellow-400 text-white p-1 rounded-full shadow-sm z-10`}
              >
                <Pin className="w-3 h-3 fill-current" />
              </div>
            )}

            {message.isForwarded && !message.isRecalled && (
              <div
                className={`flex items-center gap-1 mb-1 text-[11px] italic opacity-80 ${isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}
              >
                <Forward className="w-3 h-3" /> Forwarded
              </div>
            )}

            {!message.isRecalled && renderReplyBlock()}
            {renderContent()}

            <div
              className={`flex items-center justify-end mt-1 space-x-1 ${isOwn ? (isSticker ? "text-gray-400 dark:text-gray-500" : "text-blue-100") : "text-gray-400 dark:text-gray-400"}`}
            >
              <span className="text-[10px] leading-none">{timeString}</span>
              {renderStatus()}
            </div>
          </div>

          {/* Actions for Received Messages (Right side) — CSS group-hover, no JS gap issue */}
          {!isOwn && !message.isRecalled && (
            <div className="absolute left-full ml-2 flex items-center gap-1 bg-white dark:bg-gray-700 shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-600 rounded-lg p-1 transition-all duration-150 invisible opacity-0 group-hover:visible group-hover:opacity-100 z-10">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 hover:bg-primary-light dark:hover:bg-gray-600 rounded transition-colors"
              >
                <Smile className="w-4 h-4" />
              </button>
              <button
                onClick={() => onReply?.(message)}
                className="p-1.5 text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 hover:bg-primary-light dark:hover:bg-gray-600 rounded transition-colors"
              >
                <Reply className="w-4 h-4" />
              </button>
              <button
                onClick={() => onForward?.(message)}
                className="p-1.5 text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 hover:bg-primary-light dark:hover:bg-gray-600 rounded transition-colors"
              >
                <Forward className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPinToggle?.(message.id)}
                className={`p-1.5 rounded transition-colors ${message.isPinned ? "text-primary dark:text-blue-400 bg-primary-light dark:bg-gray-600" : "text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 hover:bg-primary-light dark:hover:bg-gray-600"}`}
              >
                <Pin className="w-4 h-4" />
              </button>
              {message.type === "text" && (
                <button
                  onClick={() => { navigator.clipboard.writeText(message.content); }}
                  className="p-1.5 text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 hover:bg-primary-light dark:hover:bg-gray-600 rounded transition-colors"
                  title="Sao chép"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onDelete?.(message.id)}
                className="p-1.5 text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-600 rounded transition-colors"
                title="Xóa phía mình"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Emoji Picker Popup */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                }}
                className={`absolute -top-10 ${isOwn ? "right-0" : "left-0"} z-20`}
                onMouseEnter={() => setShowEmojiPicker(true)}
                onMouseLeave={() => setShowEmojiPicker(false)}
              >
                {/* Invisible bridge between button and emoji picker */}
                <div className="absolute top-full left-0 right-0 h-3" />

                <div className="bg-white dark:bg-gray-700 shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-full px-2 py-1 flex gap-1 transition-colors">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact?.(message.id, emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="hover:scale-125 transition-transform text-lg px-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {renderReactions()}
      </div>
    </motion.div>
  );
};
