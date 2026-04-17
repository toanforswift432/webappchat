import React, { useState } from 'react';
import { Search, Menu, PlusCircle, Moon, Sun, Bell } from 'lucide-react';
import { Conversation } from '../types';
import { ConversationItem } from './ConversationItem';
import { CreateGroupModal } from './CreateGroupModal';
import { StatusSelector, STATUS_COLORS } from './StatusSelector';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateStatus } from '../store/slices/authSlice';
import { OnlineStatus } from '../types/api';
import { useTranslation } from '../i18n/LanguageContext';
interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
  isMobileHidden: boolean;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadNotificationCount: number;
}
export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateGroup,
  isMobileHidden,
  onOpenSearch,
  onOpenNotifications,
  unreadNotificationCount
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false);
  const currentStatusColor = STATUS_COLORS['Available'] || 'bg-green-500';
  const handleStatusSelect = async (status: string) => {
    const statusMap: Record<string, OnlineStatus> = {
      'Available': OnlineStatus.Online,
      'Away': OnlineStatus.Away,
      'In a meeting': OnlineStatus.InMeeting,
      'Working from home': OnlineStatus.WorkFromHome,
      'Offline': OnlineStatus.Offline,
    };
    const s = statusMap[status] ?? OnlineStatus.Online;
    dispatch(updateStatus(s));
    setIsStatusSelectorOpen(false);
  };
  const filteredConversations = conversations.filter((c) => {
    const name = c.isGroup ? c.groupName : c.user.name;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });
  return (
    <>
      {/* Sidebar Container */}
      <div
        className={`
        ${isMobileHidden ? 'hidden md:flex' : 'flex'}
        w-full md:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col h-full transition-colors duration-200
      `}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <img
              src="/spos.svg"
              alt="Logo"
              className="w-8 h-8" />
            
            <div
              className="flex flex-col relative cursor-pointer"
              onClick={() => setIsStatusSelectorOpen(!isStatusSelectorOpen)}>
              
              <h1 className="text-xl font-bold text-primary tracking-tight leading-none hover:opacity-80 transition-opacity">
                Z-Chat
              </h1>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <div
                  className={`w-2 h-2 rounded-full ${currentStatusColor}`}>
                </div>
                {t('status.available')}
              </span>
              <StatusSelector
                isOpen={isStatusSelectorOpen}
                onClose={() => setIsStatusSelectorOpen(false)}
                onSelect={handleStatusSelect} />
              
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSearch}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors"
              title={t('sidebar.globalSearch')}>
              
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors"
              title={t('sidebar.notifications')}>
              
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 &&
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
              }
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors"
              title={t('sidebar.createGroup')}>
              
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 transition-colors duration-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder={t('sidebar.searchConversations')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-full text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} />
            
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.length > 0 ?
          filteredConversations.map((conv) =>
          <ConversationItem
            key={conv.id}
            conversation={conv}
            isActive={conv.id === activeConversationId}
            onClick={() => {
              onSelectConversation(conv.id);
            }} />

          ) :

          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              {t('sidebar.noConversations')}
            </div>
          }
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={onCreateGroup} />
      
    </>);

};