import React, { useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../store/hooks';
import { useTranslation } from '../i18n/LanguageContext';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, memberIds: string[]) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreate }) => {
  const { t } = useTranslation();
  const friends = useAppSelector((s) => s.friends.friends);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const filteredFriends = friends.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUserIds.size === 0) return;
    setIsLoading(true);
    await onCreate(groupName.trim(), Array.from(selectedUserIds));
    setIsLoading(false);
    setGroupName('');
    setSelectedUserIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md flex flex-col shadow-2xl dark:shadow-gray-900/50"
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('modal.createGroup')}</h3>
            <button onClick={onClose} className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('modal.groupName')}</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={t('modal.groupNamePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('modal.selectMembers')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('common.search')}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2 mt-2">
              {filteredFriends.map((user) => (
                <div
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700" />
                    <span className="font-medium text-sm dark:text-gray-200">{user.name}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedUserIds.has(user.id) ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                    {selectedUserIds.has(user.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              ))}
              {filteredFriends.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('contacts.noFriends')}</p>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 transition-colors">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={!groupName.trim() || selectedUserIds.size === 0 || isLoading}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('modal.create')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
