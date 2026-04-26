import React, { useState } from "react";
import { Search, Menu, PlusCircle, Moon, Sun, Bell, MessageCircle, Users, User, Shield } from "lucide-react";
import { Conversation } from "../types";
import { AppTab } from "../types";
import { ConversationItem } from "./ConversationItem";
import { CreateGroupModal } from "./CreateGroupModal";
import { StatusSelector, STATUS_COLORS } from "./StatusSelector";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { updateStatus } from "../store/slices/authSlice";
import { OnlineStatus } from "../types/api";
import { useTranslation } from "../i18n/LanguageContext";
interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
  isMobileHidden: boolean;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadNotificationCount: number;
  activeTab?: AppTab;
  onTabChange?: (tab: AppTab) => void;
  unreadCount?: number;
  pendingRequestCount?: number;
  isAdmin?: boolean;
}
export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateGroup,
  isMobileHidden,
  onOpenSearch,
  onOpenNotifications,
  unreadNotificationCount,
  activeTab,
  onTabChange,
  unreadCount = 0,
  pendingRequestCount = 0,
  isAdmin = false,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false);

  const STATUS_LABEL_MAP: Record<OnlineStatus, { label: string; color: string }> = {
    [OnlineStatus.Online]: { label: t("status.available"), color: "bg-green-500" },
    [OnlineStatus.Away]: { label: t("status.away"), color: "bg-yellow-500" },
    [OnlineStatus.InMeeting]: { label: t("status.inMeeting"), color: "bg-purple-500" },
    [OnlineStatus.WorkFromHome]: { label: t("status.wfh"), color: "bg-blue-500" },
    [OnlineStatus.Offline]: { label: "Offline", color: "bg-gray-400" },
  };
  const currentStatusInfo = STATUS_LABEL_MAP[authUser?.status ?? OnlineStatus.Online] ?? STATUS_LABEL_MAP[OnlineStatus.Online];
  const currentStatusColor = currentStatusInfo.color;

  const handleStatusSelect = async (status: string) => {
    const statusMap: Record<string, OnlineStatus> = {
      Available: OnlineStatus.Online,
      Away: OnlineStatus.Away,
      "In a meeting": OnlineStatus.InMeeting,
      WFH: OnlineStatus.WorkFromHome,
      Offline: OnlineStatus.Offline,
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
        ${isMobileHidden ? "hidden md:flex" : "flex"}
        w-full md:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col h-full transition-colors duration-200
      `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}ami-logo.svg`} alt="Ami Chat" className="w-8 h-8" />

            <div
              className="flex flex-col relative cursor-pointer"
              onClick={() => setIsStatusSelectorOpen(!isStatusSelectorOpen)}
            >
              <h1 className="text-xl font-bold text-primary tracking-tight leading-none hover:opacity-80 transition-opacity">
                Ami Chat
              </h1>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <div className={`w-2 h-2 rounded-full ${currentStatusColor}`}></div>
                {currentStatusInfo.label}
              </span>
              <StatusSelector
                isOpen={isStatusSelectorOpen}
                onClose={() => setIsStatusSelectorOpen(false)}
                onSelect={handleStatusSelect}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSearch}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors"
              title={t("sidebar.globalSearch")}
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors"
              title={t("sidebar.notifications")}
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white dark:border-gray-900">
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors"
              title={t("sidebar.createGroup")}
            >
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
              placeholder={t("sidebar.searchConversations")}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-full text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onClick={() => {
                  onSelectConversation(conv.id);
                }}
              />
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              {t("sidebar.noConversations")}
            </div>
          )}
        </div>

        {/* Desktop-only bottom nav tabs */}
        {onTabChange && (
          <div className="hidden md:flex border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            {[
              { id: "chat" as AppTab, icon: MessageCircle, label: t("nav.chat"), badge: unreadCount },
              { id: "contacts" as AppTab, icon: Users, label: t("nav.contacts"), badge: pendingRequestCount },
              { id: "profile" as AppTab, icon: User, label: t("nav.profile"), badge: 0 },
              ...(isAdmin ? [{ id: "admin" as AppTab, icon: Shield, label: "Admin", badge: 0 }] : []),
            ].map(({ id, icon: Icon, label, badge }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative ${activeTab === id ? "text-primary" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${activeTab === id ? "fill-primary/20" : ""}`} />
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center border border-white dark:border-gray-900 leading-none">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={onCreateGroup}
      />
    </>
  );
};
