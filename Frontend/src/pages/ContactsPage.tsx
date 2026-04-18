import React, { useEffect, useState } from "react";
import { Search, UserPlus, Check, X, UserMinus, MessageCircle, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchFriends,
  fetchFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriendUser,
} from "../store/slices/friendSlice";
import { userService } from "../services/user.service";
import { mapUser } from "../types/mappers";
import type { User } from "../types";
import { useTranslation } from "../i18n/LanguageContext";

interface ContactsPageProps {
  onOpenChat: (userId: string) => void;
}

type SubTab = "friends" | "requests" | "find";

export const ContactsPage: React.FC<ContactsPageProps> = ({ onOpenChat }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { friends, requestDetails, status } = useAppSelector((s) => s.friends);
  const currentUserId = useAppSelector((s) => s.auth.user?.id ?? "");

  const [activeTab, setActiveTab] = useState<SubTab>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [findQuery, setFindQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);

  useEffect(() => {
    dispatch(fetchFriends());
    dispatch(fetchFriendRequests());
  }, []);

  useEffect(() => {
    if (findQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const dtos = await userService.search(findQuery);
        setSearchResults(dtos.filter((u) => u.id !== currentUserId).map(mapUser));
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [findQuery, currentUserId]);

  const filteredFriends = friends.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const pendingReceivedRequests = requestDetails;

  const isFriend = (userId: string) => friends.some((f) => f.id === userId);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t("contacts.title")}</h1>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {(["friends", "requests", "find"] as SubTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors relative ${
                activeTab === tab
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab === "friends" && t("contacts.friends")}
              {tab === "requests" && (
                <>
                  {t("contacts.requests")}
                  {pendingReceivedRequests.length > 0 && (
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </>
              )}
              {tab === "find" && t("contacts.findPeople")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
        <AnimatePresence mode="wait">
          {status === "loading" ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              {activeTab === "friends" && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder={t("contacts.searchFriends")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:ring-primary focus:border-primary bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                    />
                  </div>

                  {filteredFriends.length > 0 ? (
                    <div className="space-y-2">
                      {filteredFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => onOpenChat(friend.id)}
                          >
                            <div className="relative">
                              <img
                                src={friend.avatar}
                                alt={friend.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              {friend.isOnline && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">{friend.name}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {friend.statusMessage || t("contacts.available")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onOpenChat(friend.id)}
                              className="p-2 text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors"
                            >
                              <MessageCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(t("contacts.removeFriendConfirm"))) {
                                  dispatch(unfriendUser(friend.id));
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                              title={t("contacts.removeFriend")}
                            >
                              <UserMinus className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">{t("contacts.noFriends")}</p>
                      <button
                        onClick={() => setActiveTab("find")}
                        className="mt-4 text-primary hover:underline text-sm font-medium"
                      >
                        {t("contacts.findConnect")}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "requests" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      {t("contacts.received")} ({pendingReceivedRequests.length})
                    </h3>
                    {pendingReceivedRequests.length > 0 ? (
                      <div className="space-y-2">
                        {pendingReceivedRequests.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  req.fromUser.avatarUrl ??
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(req.fromUser.displayName)}&background=6366f1&color=fff`
                                }
                                alt={req.fromUser.displayName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {req.fromUser.displayName}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {t("contacts.wantsToConnect")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => dispatch(acceptFriendRequest(req.id))}
                                className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => dispatch(rejectFriendRequest(req.id))}
                                className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        {t("contacts.noReceivedRequests")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "find" && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder={t("contacts.searchByName")}
                      value={findQuery}
                      onChange={(e) => setFindQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:ring-primary focus:border-primary bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                    />
                  </div>

                  {findQuery.trim().length > 1 ? (
                    searchResults.length > 0 ? (
                      <div className="space-y-2">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{user.name}</h3>
                            </div>
                            {isFriend(user.id) ? (
                              <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                                {t("contacts.friend")}
                              </span>
                            ) : (
                              <button
                                onClick={() => dispatch(sendFriendRequest(user.id))}
                                className="flex items-center gap-1 text-xs font-medium text-white bg-primary px-3 py-1.5 rounded-md hover:bg-primary-hover transition-colors"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                {t("contacts.add")}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        {t("contacts.noUsersFound")} "{findQuery}"
                      </div>
                    )
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{t("contacts.typeToSearch")}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
