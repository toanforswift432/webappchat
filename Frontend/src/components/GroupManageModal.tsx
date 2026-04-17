import React, { useEffect, useState } from 'react';
import { X, Check, Trash2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../store/hooks';
import { useTranslation } from '../i18n/LanguageContext';
import { Conversation } from '../types';

interface GroupManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Conversation;
  currentUserId: string;
  onUpdateMembers: (memberIds: string[]) => void;
  onRemoveGroup: () => void;
}

export const GroupManageModal: React.FC<GroupManageModalProps> = ({
  isOpen,
  onClose,
  group,
  currentUserId,
  onUpdateMembers,
  onRemoveGroup,
}) => {
  const { t } = useTranslation();
  const friends = useAppSelector((s) => s.friends.friends);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isAdmin = group.adminId === currentUserId;

  useEffect(() => {
    if (isOpen) {
      const initialIds = new Set(
        group.members?.filter((m) => m.id !== currentUserId).map((m) => m.id) ?? []
      );
      setSelectedUserIds(initialIds);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, group, currentUserId]);

  if (!isOpen || !group.isGroup) return null;

  const toggleUser = (userId: string) => {
    if (!isAdmin) return;
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    await onUpdateMembers(Array.from(selectedUserIds));
    setIsLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    setIsLoading(true);
    await onRemoveGroup();
    setIsLoading(false);
    onClose();
  };

  const displayUsers = isAdmin ? friends : (group.members?.filter((m) => m.id !== currentUserId) ?? []);

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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('modal.manageGroup')}</h3>
            <button onClick={onClose} className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                {t('chat.members')} ({selectedUserIds.size + 1})
                {!isAdmin && (
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">View Only</span>
                )}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mr-3">Me</div>
                  <span className="font-medium text-sm dark:text-gray-200">
                    You {isAdmin && <span className="text-xs text-primary ml-1">(Admin)</span>}
                  </span>
                </div>

                {displayUsers.map((user) => {
                  const isSelected = selectedUserIds.has(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                        isAdmin ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                      } ${isSelected ? 'border-gray-200 dark:border-gray-600' : 'border-transparent'}`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700" />
                        <span className="font-medium text-sm dark:text-gray-200">{user.name}</span>
                      </div>
                      {isAdmin && (
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {isAdmin && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Group
                  </button>
                ) : (
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/50">
                    <p className="text-sm text-red-800 dark:text-red-300 mb-3 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      Are you sure? This will permanently delete the group for all members.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 transition-colors">Cancel</button>
                      <button onClick={handleDelete} disabled={isLoading} className="flex-1 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50 transition-colors">
                        {isLoading ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={isLoading || selectedUserIds.size === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
