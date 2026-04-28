import React, { useEffect, useState } from "react";
import { Search, UserPlus, Check, X, UserMinus, MessageCircle, Users, ArrowLeft, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchFriends,
  fetchFriendRequests,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriendUser,
} from "../store/slices/friendSlice";
import { userService } from "../services/user.service";
import { mapUser } from "../types/mappers";
import type { User } from "../types";
import { FriendshipStatus } from "../types";
import type { ColleagueDto } from "../types/api";
import { useTranslation } from "../i18n/LanguageContext";

interface ContactsPageProps {
  onOpenChat: (userId: string) => void;
  onBack?: () => void;
}

type SubTab = "friends" | "colleagues" | "requests" | "find";

export const ContactsPage: React.FC<ContactsPageProps> = ({ onOpenChat, onBack }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { friends, requestDetails, sentRequests, status } = useAppSelector((s) => s.friends);
  const currentUserId = useAppSelector((s) => s.auth.user?.id ?? "");

  const [activeTab, setActiveTab] = useState<SubTab>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [findQuery, setFindQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [colleagues, setColleagues] = useState<ColleagueDto[]>([]);
  const [colleaguesLoading, setColleaguesLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchFriends());
    dispatch(fetchFriendRequests());
  }, []);

  useEffect(() => {
    if (activeTab === "colleagues") {
      loadColleagues();
    }
  }, [activeTab]);

  const loadColleagues = async () => {
    try {
      setColleaguesLoading(true);
      const data = await userService.getColleagues();
      setColleagues(data);
    } catch (error) {
      console.error("Failed to load colleagues:", error);
    } finally {
      setColleaguesLoading(false);
    }
  };

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

  const hasSentRequest = (userId: string) => sentRequests.includes(userId);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("contacts.title")}</h1>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {(["friends", "colleagues", "requests", "find"] as SubTab[]).map((tab) => (
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
              {tab === "colleagues" && t("contacts.colleagues")}
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

              {activeTab === "colleagues" && (
                <div className="space-y-4">
                  {colleaguesLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : colleagues.length > 0 ? (
                    <div className="space-y-2">
                      {colleagues.map((colleague) => (
                        <div
                          key={colleague.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => onOpenChat(colleague.id)}
                          >
                            <div className="relative">
                              <img
                                src={
                                  colleague.avatarUrl ??
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(colleague.displayName)}&background=6366f1&color=fff`
                                }
                                alt={colleague.displayName}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              {colleague.status === 1 && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{colleague.displayName}</h3>
                                {colleague.companyName && (
                                  <div className="group relative">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-md">
                                      <Building2 className="w-3 h-3" />
                                      Đồng nghiệp
                                    </span>
                                    <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                      {colleague.companyName}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{colleague.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => onOpenChat(colleague.id)}
                            className="p-2 text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors"
                          >
                            <MessageCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Building2 className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">{t("contacts.noColleagues")}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {t("contacts.colleaguesDescription")}
                      </p>
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
                            {user.friendshipStatus === FriendshipStatus.Friend ? (
                              <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                                {t("contacts.friend")}
                              </span>
                            ) : user.friendshipStatus === FriendshipStatus.RequestSent ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                                  {t("contacts.requestSent")}
                                </span>
                                <button
                                  onClick={() => dispatch(cancelFriendRequest(user.id))}
                                  className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                  {t("contacts.cancel")}
                                </button>
                              </div>
                            ) : user.friendshipStatus === FriendshipStatus.RequestReceived ? (
                              <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                                {t("contacts.requestReceived")}
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
