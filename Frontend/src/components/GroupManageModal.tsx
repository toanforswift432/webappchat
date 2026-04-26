import React, { useEffect, useRef, useState } from "react";
import { X, Camera, UserMinus, UserPlus, Crown, LogOut, Trash2, AlertTriangle, Check, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { Conversation } from "../types";
import { conversationService } from "../services/conversation.service";
import {
  removeConversation,
  removeMemberFromConv,
  renameConversation,
  upsertConversation,
  setActiveConversation,
} from "../store/slices/conversationSlice";

type Tab = "members" | "add";

interface ConfirmState {
  type: "kick" | "leave" | "delete";
  userId?: string;
  userName?: string;
}

interface GroupManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Conversation;
  currentUserId: string;
  onUpdateMembers: (memberIds: string[]) => void;
  onRemoveGroup: () => void;
}

export const GroupManageModal: React.FC<GroupManageModalProps> = ({ isOpen, onClose, group, currentUserId }) => {
  const dispatch = useAppDispatch();
  const friends = useAppSelector((s) => s.friends.friends);

  const [tab, setTab] = useState<Tab>("members");
  const [isLoading, setIsLoading] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(group.groupName ?? "");
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = group.adminId === currentUserId;
  const currentMembers = group.members ?? [];
  const memberIds = new Set(currentMembers.map((m) => m.id));
  const friendsToAdd = friends.filter((f) => !memberIds.has(f.id));

  useEffect(() => {
    if (isOpen) {
      setTab("members");
      setConfirm(null);
      setIsEditingName(false);
      setNameInput(group.groupName ?? "");
    }
  }, [isOpen, group]);

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus();
  }, [isEditingName]);

  if (!isOpen || !group.isGroup) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      await conversationService.uploadGroupAvatar(group.id, file);
    } catch {
      /* SignalR GroupAvatarUpdated updates store */
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleRename = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === group.groupName) {
      setIsEditingName(false);
      return;
    }
    try {
      await conversationService.renameGroup(group.id, trimmed);
      dispatch(renameConversation({ conversationId: group.id, name: trimmed }));
    } catch {
      setNameInput(group.groupName ?? "");
    }
    setIsEditingName(false);
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setIsLoading(true);
    try {
      if (confirm.type === "kick" && confirm.userId) {
        await conversationService.kickMember(group.id, confirm.userId);
        dispatch(removeMemberFromConv({ conversationId: group.id, userId: confirm.userId }));
        setConfirm(null);
      } else if (confirm.type === "leave" || confirm.type === "delete") {
        await conversationService.leaveGroup(group.id);
        dispatch(removeConversation(group.id));
        dispatch(setActiveConversation(null));
        onClose();
      }
    } catch {
      setConfirm(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setAddingIds((prev) => new Set(prev).add(userId));
    try {
      await conversationService.addMember(group.id, userId);
      const friend = friends.find((f) => f.id === userId);
      if (friend) {
        dispatch(upsertConversation({ ...group, members: [...currentMembers, friend] }));
      }
    } catch {
      /* silent */
    } finally {
      setAddingIds((prev) => {
        const s = new Set(prev);
        s.delete(userId);
        return s;
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Group Info</h3>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Group avatar + name */}
          <div className="flex flex-col items-center py-5 border-b border-gray-100 dark:border-gray-700 gap-2">
            <div className="relative">
              {group.groupAvatar ? (
                <img
                  src={group.groupAvatar}
                  alt={group.groupName}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-gray-700 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {(group.groupName ?? "G").slice(0, 2).toUpperCase()}
                </div>
              )}
              {isAdmin && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-gray-800/80 hover:bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-60"
                  title="Change photo"
                >
                  {isUploadingAvatar ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  ref={nameInputRef}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  className="border-b-2 border-primary bg-transparent text-center font-semibold text-gray-900 dark:text-white focus:outline-none px-1"
                  maxLength={50}
                />
                <button
                  onClick={handleRename}
                  className="p-1 text-primary rounded-full hover:bg-primary/10 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="p-1 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-semibold text-gray-900 dark:text-white">{group.groupName}</span>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-gray-400 hover:text-primary rounded-full transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <span className="text-xs text-gray-400">{currentMembers.length} members</span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setTab("members")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "members" ? "text-primary border-b-2 border-primary" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >
              Members ({currentMembers.length})
            </button>
            {isAdmin && (
              <button
                onClick={() => setTab("add")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "add" ? "text-primary border-b-2 border-primary" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
              >
                Add Members
              </button>
            )}
          </div>

          {/* Tab content */}
          <div className="overflow-y-auto flex-1 py-2">
            {tab === "members" && (
              <div className="space-y-0.5 px-2">
                {currentMembers.map((member) => {
                  const isSelf = member.id === currentUserId;
                  const isMemberAdmin = member.id === group.adminId;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                          />
                          {member.status !== 0 && (
                            <div
                              className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-800 rounded-full ${
                                member.status === 1
                                  ? "bg-green-500" // Online
                                  : member.status === 2
                                    ? "bg-yellow-500" // Away
                                    : member.status === 3
                                      ? "bg-purple-500" // InMeeting
                                      : member.status === 4
                                        ? "bg-blue-500"
                                        : "bg-gray-400" // WorkFromHome : Offline
                              }`}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {member.name}
                            </span>
                            {isSelf && <span className="text-xs text-gray-400 dark:text-gray-500">(you)</span>}
                          </div>
                          {isMemberAdmin ? (
                            <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                              <Crown className="w-3 h-3" />
                              <span>Admin</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Member</span>
                          )}
                        </div>
                      </div>
                      {isAdmin && !isSelf && !isMemberAdmin && (
                        <button
                          onClick={() => setConfirm({ type: "kick", userId: member.id, userName: member.name })}
                          className="ml-2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors flex-shrink-0"
                          title="Remove from group"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "add" && isAdmin && (
              <div className="space-y-0.5 px-2">
                {friendsToAdd.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-8">All friends are already in this group</p>
                )}
                {friendsToAdd.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                        />
                        {friend.status !== 0 && (
                          <div
                            className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-800 rounded-full ${
                              friend.status === 1
                                ? "bg-green-500" // Online
                                : friend.status === 2
                                  ? "bg-yellow-500" // Away
                                  : friend.status === 3
                                    ? "bg-purple-500" // InMeeting
                                    : friend.status === 4
                                      ? "bg-blue-500"
                                      : "bg-gray-400" // WorkFromHome : Offline
                            }`}
                          />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{friend.name}</span>
                    </div>
                    <button
                      onClick={() => handleAddMember(friend.id)}
                      disabled={addingIds.has(friend.id)}
                      className="ml-2 p-2 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-full transition-colors flex-shrink-0 disabled:opacity-50"
                      title="Add to group"
                    >
                      {addingIds.has(friend.id) ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
            {!isAdmin && (
              <button
                onClick={() => setConfirm({ type: "leave" })}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Leave Group
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setConfirm({ type: "delete" })}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Group
              </button>
            )}
          </div>
        </motion.div>

        {/* Confirmation overlay */}
        <AnimatePresence>
          {confirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-2xl p-6"
              style={{ position: "fixed" }}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${confirm.type === "kick" ? "bg-orange-100 dark:bg-orange-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
                  >
                    <AlertTriangle
                      className={`w-6 h-6 ${confirm.type === "kick" ? "text-orange-500" : "text-red-500"}`}
                    />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                      {confirm.type === "kick" && "Remove Member"}
                      {confirm.type === "leave" && "Leave Group"}
                      {confirm.type === "delete" && "Delete Group"}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {confirm.type === "kick" &&
                        `Remove ${confirm.userName} from the group? They won't be able to see messages anymore.`}
                      {confirm.type === "leave" && "Are you sure you want to leave this group?"}
                      {confirm.type === "delete" &&
                        "This will permanently delete the group for all members. This action cannot be undone."}
                    </p>
                  </div>
                  <div className="flex gap-3 w-full pt-1">
                    <button
                      onClick={() => setConfirm(null)}
                      disabled={isLoading}
                      className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={isLoading}
                      className={`flex-1 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 ${confirm.type === "kick" ? "bg-orange-500 hover:bg-orange-600" : "bg-red-500 hover:bg-red-600"}`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : confirm.type === "kick" ? (
                        "Remove"
                      ) : confirm.type === "leave" ? (
                        "Leave"
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
