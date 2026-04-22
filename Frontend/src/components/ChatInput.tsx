import React, { useEffect, useState, useRef } from "react";
import { Send, Image as ImageIcon, Paperclip, Smile, X, Reply, Sticker, BarChart2 } from "lucide-react";
import { Message, Conversation } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "../types";
import { useTranslation } from "../i18n/LanguageContext";
import { conversationService } from "../services/conversation.service";
import { MessageType } from "../types/api";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addRealTimeMessage } from "../store/slices/messageSlice";
interface ChatInputProps {
  conversation: Conversation;
  onSendMessage: (
    content: string,
    type: "text" | "image" | "file" | "sticker" | "poll",
    fileData?: {
      name: string;
      size: string;
    },
  ) => void;
  onImageSelect: (url: string) => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  isGroup?: boolean;
  onCreatePoll?: () => void;
  members?: User[];
  onTyping?: (isTyping: boolean) => void;
}
const STICKER_PACKS = [
  {
    id: "happy",
    label: "😊",
    stickers: [
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f601/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f603/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f604/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f606/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f607/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f609/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60a/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f618/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f970/512.webp",
    ],
  },
  {
    id: "sad",
    label: "😢",
    stickers: [
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f614/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f615/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f616/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f622/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62b/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f629/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f97a/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f928/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f971/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f644/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f624/512.webp",
    ],
  },
  {
    id: "love",
    label: "❤️",
    stickers: [
      "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f495/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f496/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f497/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f498/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f499/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f49a/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f49b/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f49c/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f49e/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f48b/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60b/512.webp",
    ],
  },
  {
    id: "party",
    label: "🎉",
    stickers: [
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f38a/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f942/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f37e/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f381/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f382/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f388/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/2b50/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f31f/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.webp",
    ],
  },
  {
    id: "animals",
    label: "🐱",
    stickers: [
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f431/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f436/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f43b/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f430/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f984/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f43c/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f427/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f98a/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f439/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f43f_fe0f/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f414/512.webp",
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f98e/512.webp",
    ],
  },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  conversation,
  onSendMessage,
  onImageSelect,
  replyingTo,
  onCancelReply,
  isGroup,
  onCreatePoll,
  members = [],
  onTyping,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector((s) => s.auth.user?.id ?? "");
  const [text, setText] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [activeStickerPack, setActiveStickerPack] = useState(0);
  // Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // Typing indicator: track whether we've notified "isTyping=true"
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);
  const stopTyping = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = null;
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping?.(false);
    }
  };

  const handleSendText = () => {
    if (text.trim()) {
      stopTyping();
      onSendMessage(text.trim(), "text");
      setText("");
      setMentionQuery(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Typing indicator
    if (val.trim()) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTyping?.(true);
      }
      // Reset stop-typing debounce (2 s silence = stopped typing)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(stopTyping, 2000);
    } else {
      stopTyping();
    }

    if (!isGroup || members.length === 0) return;
    // Simple mention detection: look for '@' followed by word characters at the end of the cursor
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const match = textBeforeCursor.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setMentionIndex(match.index!);
    } else {
      setMentionQuery(null);
    }
  };
  const handleMentionSelect = (user: User) => {
    if (mentionIndex === -1) return;
    const beforeMention = text.slice(0, mentionIndex);
    const afterMention = text.slice(textareaRef.current?.selectionStart || text.length);
    const newText = `${beforeMention}@${user.name} ${afterMention}`;
    setText(newText);
    setMentionQuery(null);
    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeMention.length + user.name.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };
  const filteredMembers =
    mentionQuery !== null ? members.filter((m) => m.name.toLowerCase().includes(mentionQuery)) : [];
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredMembers.length > 0) {
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
      // Could add arrow key navigation here for the mention list
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview first
      const url = URL.createObjectURL(file);
      onImageSelect(url);
      // Store file for later upload when sending
      (window as any).__pendingImageFile = file;
    }
    if (imageInputRef.current) imageInputRef.current.value = "";
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const messageDto = await conversationService.uploadAndSend(conversation.id, file, MessageType.File);
        // Dispatch immediately for instant display
        dispatch(addRealTimeMessage({ dto: messageDto, currentUserId }));
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed. Please try again.");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleStickerClick = (url: string) => {
    onSendMessage(url, "sticker");
    setShowStickers(false);
  };
  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex flex-col relative transition-colors duration-200">
      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between transition-colors">
          <div className="flex items-start gap-2 overflow-hidden">
            <Reply className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-primary">{t("chat.replyingTo")}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {replyingTo.type === "image"
                  ? t("chat.image")
                  : replyingTo.type === "file"
                    ? t("chat.file")
                    : replyingTo.content}
              </span>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-3">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          {/* Action Buttons */}
          <div className="flex gap-1 pb-2">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors"
              title={t("chat.attachImage")}
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors"
              title={t("chat.attachFile")}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            {isGroup && (
              <button
                onClick={onCreatePoll}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors hidden sm:block"
                title={t("chat.createPoll")}
              >
                <BarChart2 className="w-5 h-5" />
              </button>
            )}

            {/* Hidden Inputs */}
            <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={handleImageChange} />

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Input Area */}
          <div className="flex-1 relative bg-gray-100 dark:bg-gray-800 rounded-2xl border border-transparent focus-within:border-primary dark:focus-within:border-primary focus-within:bg-white dark:focus-within:bg-gray-900 transition-colors flex items-center">
            {/* Mention Picker */}
            <AnimatePresence>
              {mentionQuery !== null && filteredMembers.length > 0 && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: 10,
                  }}
                  className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-2 z-50 max-h-48 overflow-y-auto custom-scrollbar"
                >
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2 uppercase">
                    {t("chat.members")}
                  </div>
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleMentionSelect(member)}
                      className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                      <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-full" />

                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <button
                onClick={() => setShowStickers(!showStickers)}
                className="p-2 ml-1 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-colors"
                title={t("chat.stickers")}
              >
                <Sticker className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showStickers && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 10,
                      scale: 0.95,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: 10,
                      scale: 0.95,
                    }}
                    className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 z-50 overflow-hidden transition-colors"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center px-3 pt-3 pb-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        {t("chat.stickers")}
                      </span>
                      <button
                        onClick={() => setShowStickers(false)}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Category tabs */}
                    <div className="flex gap-1 px-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                      {STICKER_PACKS.map((pack, idx) => (
                        <button
                          key={pack.id}
                          onClick={() => setActiveStickerPack(idx)}
                          className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-colors ${
                            activeStickerPack === idx
                              ? "bg-primary/10 ring-2 ring-primary"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {pack.label}
                        </button>
                      ))}
                    </div>
                    {/* Sticker grid */}
                    <div className="grid grid-cols-4 gap-1 p-2 max-h-52 overflow-y-auto custom-scrollbar">
                      {STICKER_PACKS[activeStickerPack].stickers.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => handleStickerClick(url)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center aspect-square"
                        >
                          <img src={url} alt="Sticker" className="w-12 h-12 object-contain" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.typeMessage")}
              className="w-full bg-transparent py-3 px-2 max-h-[120px] resize-none focus:outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 custom-scrollbar"
              rows={1}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendText}
            disabled={!text.trim()}
            className={`p-3 rounded-full flex-shrink-0 transition-colors ${text.trim() ? "bg-primary text-white hover:bg-primary-hover shadow-sm" : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"}`}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
