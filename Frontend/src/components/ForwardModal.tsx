import React, { useState } from 'react';
import { X, Search, Forward } from 'lucide-react';
import { Conversation, Message } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n/LanguageContext';

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageToForward: Message | null;
  conversations: Conversation[];
  onForward: (messageId: string, targetConversationId: string) => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({
  isOpen,
  onClose,
  messageToForward,
  conversations,
  onForward,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !messageToForward) return null;

  const filteredConversations = conversations.filter((c) => {
    const name = c.isGroup ? c.groupName : c.user.name;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleForward = async () => {
    if (!selectedConvId) return;
    setIsLoading(true);
    await onForward(messageToForward.id, selectedConvId);
    setIsLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md flex flex-col shadow-2xl dark:shadow-gray-900/50 max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('modal.forwardMessage')}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 truncate">
              {messageToForward.type === 'image' ? '🖼️ Image' : messageToForward.type === 'file' ? '📎 File' : messageToForward.content}
            </div>
          </div>

          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('modal.searchConversations')}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 transition-colors"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 px-2 pb-2">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedConvId === conv.id
                      ? 'bg-primary/10 dark:bg-primary/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <img
                    src={conv.isGroup ? conv.groupAvatar : conv.user.avatar}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                  />
                  <span className="ml-3 font-medium text-sm text-gray-900 dark:text-gray-200">
                    {conv.isGroup ? conv.groupName : conv.user.name}
                  </span>
                  {selectedConvId === conv.id && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No conversations found.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleForward}
              disabled={!selectedConvId || isLoading}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Forward className="w-4 h-4" />
              {t('modal.forward')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
