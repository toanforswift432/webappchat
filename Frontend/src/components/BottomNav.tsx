import React from 'react';
import { MessageCircle, Users, User, Shield } from 'lucide-react';
import { AppTab } from '../types';
import { motion } from 'framer-motion';
import { useTranslation } from '../i18n/LanguageContext';
import { AccountType } from '../types/api';
interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  unreadCount: number;
  pendingRequestCount: number;
  isAdmin?: boolean;
}
export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadCount,
  pendingRequestCount,
  isAdmin = false,
}) => {
  const { t } = useTranslation();
  const tabs = [
  {
    id: 'chat' as AppTab,
    icon: MessageCircle,
    label: t('nav.chat'),
    badge: unreadCount
  },
  {
    id: 'contacts' as AppTab,
    icon: Users,
    label: t('nav.contacts'),
    badge: pendingRequestCount
  },
  {
    id: 'profile' as AppTab,
    icon: User,
    label: t('nav.profile'),
    badge: 0
  },
  ...(isAdmin ? [{
    id: 'admin' as AppTab,
    icon: Shield,
    label: 'Admin',
    badge: 0,
  }] : []),
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 pb-safe transition-colors duration-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-none">
      <div className="flex items-center justify-around h-14">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center justify-center w-full h-full relative">
            
            <motion.div
              whileTap={{
                scale: 0.9
              }}
              className={`relative p-1 ${isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
              
              <Icon
                className={`w-6 h-6 ${isActive ? 'fill-primary/20' : ''}`} />
              
              {tab.badge > 0 &&
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white dark:border-gray-900">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              }
            </motion.div>
            <span
              className={`text-[10px] font-medium mt-0.5 ${isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
              
              {tab.label}
            </span>
          </button>);

      })}
      </div>
    </div>);

};