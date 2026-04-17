import React from 'react';
import {
  Bell,
  MessageCircle,
  UserPlus,
  AtSign,
  Info,
  Check,
  X } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppNotification } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '../i18n/LanguageContext';
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNotificationClick: (notif: AppNotification) => void;
}
export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNotificationClick
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;
  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'friend_request':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };
  return (
    <AnimatePresence>
      <motion.div
        initial={{
          y: -20,
          opacity: 0
        }}
        animate={{
          y: 0,
          opacity: 1
        }}
        exit={{
          y: -20,
          opacity: 0
        }}
        className="absolute top-16 right-0 md:right-4 w-full md:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-gray-900/50 z-30 md:rounded-xl overflow-hidden flex flex-col max-h-[80vh]">
        
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t('notifPanel.title')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.isRead) &&
            <button
              onClick={onMarkAllRead}
              className="text-xs font-medium text-primary hover:underline">
              
                {t('notifPanel.markAllRead')}
              </button>
            }
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
              
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1">
          {notifications.length > 0 ?
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((notif) =>
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.isRead) onMarkRead(notif.id);
                onNotificationClick(notif);
              }}
              className={`p-4 flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notif.isRead ? 'bg-primary-light/30 dark:bg-primary-dark-light/20' : ''}`}>
              
                  <div className="mt-1 flex-shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                  className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-800 dark:text-gray-200'}`}>
                  
                      {notif.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {notif.body}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notif.timestamp), {
                    addSuffix: true
                  })}
                    </p>
                  </div>
                  {!notif.isRead &&
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              }
                </div>
            )}
            </div> :

          <div className="p-8 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('notifPanel.noNotifications')}
              </p>
            </div>
          }
        </div>
      </motion.div>
    </AnimatePresence>);

};