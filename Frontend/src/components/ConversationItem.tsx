import React from 'react';
import { Conversation } from '../types';
import { format } from 'date-fns';
import { useTranslation } from '../i18n/LanguageContext';
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}
export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick
}) => {
  const { t } = useTranslation();
  const { user, lastMessage, unreadCount, isGroup, groupName, groupAvatar } =
  conversation;
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'HH:mm');
    }
    return format(date, 'MMM d');
  };
  const displayName = isGroup ? groupName : user.name;
  const displayAvatar = isGroup ? groupAvatar : user.avatar;
  const renderLastMessage = () => {
    if (!lastMessage) return '';
    switch (lastMessage.type) {
      case 'image':   return '🖼️ ' + (t('chat.image') || 'Image');
      case 'file':    return '📎 ' + (lastMessage.fileName || t('chat.file') || 'File');
      case 'sticker': return '😊 Sticker';
      case 'poll':    return '📊 Poll';
      case 'system':  return lastMessage.content ?? '';
      default:        return lastMessage.content ?? '';
    }
  };
  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer transition-colors duration-200 ${isActive ? 'bg-primary-light dark:bg-primary-dark-light' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}>
      
      <div className="relative flex-shrink-0">
        <img
          src={displayAvatar}
          alt={displayName}
          className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
        
        {!isGroup && user.isOnline &&
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
        }
      </div>

      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3
            className={`text-sm font-semibold truncate ${isActive ? 'text-primary dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
            
            {displayName}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
            {formatTime(lastMessage?.timestamp)}
          </span>
        </div>

        <div className="flex justify-between items-center mt-1 min-w-0">
          <p
            className={`text-sm truncate min-w-0 flex-1 ${unreadCount > 0 ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {renderLastMessage()}
          </p>
          {unreadCount > 0 &&
          <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          }
        </div>
      </div>
    </div>);

};