import React, { useEffect, useState } from "react";
import {
  Edit2,
  Moon,
  Sun,
  LogOut,
  Bell,
  Globe,
  Shield,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Volume2,
  Play,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Account } from "../types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { updateProfile, updateNotificationSettings } from "../store/slices/authSlice";
import { useTranslation } from "../i18n/LanguageContext";
import { userService } from "../services/user.service";
import type { NotificationSettingsDto } from "../types/api";
import { avatarUrl as resolveAvatarUrl } from "../types/mappers";
import { playMessageSound, playNotificationSound, NotificationSoundType, SOUND_NAMES } from "../utils/sounds";

interface ProfilePageProps {
  account: Account;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onBack?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ account, isDarkMode, onToggleDarkMode, onLogout, onBack }) => {
  const { t, language, setLanguage } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.displayName ?? account.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [expandedSection, setExpandedSection] = useState<"notifications" | "language" | "privacy" | null>(null);

  const [notifPrefs, setNotifPrefs] = useState<NotificationSettingsDto>(() => {
    return user?.notificationSettings ?? { messages: true, sound: true, preview: true, groups: true, mentions: true };
  });

  const [privacyPrefs, setPrivacyPrefs] = useState(() => {
    const saved = localStorage.getItem("privacyPrefs");
    return saved ? JSON.parse(saved) : { onlineStatus: true, readReceipts: true, allowRequests: true };
  });

  useEffect(() => {
    localStorage.setItem("privacyPrefs", JSON.stringify(privacyPrefs));
  }, [privacyPrefs]);

  useEffect(() => {
    setName(user?.displayName ?? account.name);
    console.log("👤 User object:", user);
    console.log("🔔 Notification settings from user:", user?.notificationSettings);
    if (user?.notificationSettings) {
      setNotifPrefs(user.notificationSettings);
      console.log("✅ Set notifPrefs to:", user.notificationSettings);
    } else {
      console.warn("⚠️ No notification settings in user object!");
    }
  }, [user, account.name]);

  const handleNotifToggle = async (field: keyof NotificationSettingsDto) => {
    const newPrefs = { ...notifPrefs, [field]: !notifPrefs[field] };
    setNotifPrefs(newPrefs);
    try {
      await userService.updateNotifications(newPrefs);
      // Update Redux store
      dispatch(updateNotificationSettings(newPrefs));
    } catch (error) {
      console.error("Failed to update notification settings", error);
      // Revert on error
      setNotifPrefs(notifPrefs);
    }
  };

  const handleSoundTypeChange = async (type: "message" | "call", soundType: NotificationSoundType) => {
    const field = type === "message" ? "messageSoundType" : "callSoundType";
    const newPrefs = { ...notifPrefs, [field]: soundType };
    setNotifPrefs(newPrefs);
    try {
      await userService.updateNotifications(newPrefs);
      dispatch(updateNotificationSettings(newPrefs));
    } catch (error) {
      console.error("Failed to update sound type", error);
      setNotifPrefs(notifPrefs);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dispatch(updateProfile({ displayName: name }));
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.displayName ?? account.name);
    setIsEditing(false);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const avatarUrl = await userService.uploadAvatar(file);
      dispatch(updateProfile({ displayName: user?.displayName ?? account.name, avatarUrl }));
    } catch {
      // silent fail
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const displayName = user?.displayName ?? account.name;
  const email = user?.email ?? account.email;
  const avatarUrl = resolveAvatarUrl({ displayName, avatarUrl: user?.avatarUrl ?? null });

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-y-auto custom-scrollbar pb-20">
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-1.5 -ml-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("profile.title")}</h1>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 flex flex-col items-center border-b border-gray-200 dark:border-gray-700">
        <div className="relative mb-4">
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
          />
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary hover:bg-primary-hover text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-60"
            title="Đổi ảnh đại diện"
          >
            {isUploadingAvatar
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Edit2 className="w-4 h-4" />
            }
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileChange}
          />
        </div>

        {!isEditing ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{email}</p>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t("profile.fullName")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t("profile.emailReadonly")}
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-4 h-4" /> {t("profile.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-1 disabled:opacity-70"
              >
                <Check className="w-4 h-4" /> {isSaving ? t("profile.saving") : t("profile.save")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t("profile.settings")}
          </h3>
        </div>

        <div className="flex flex-col">
          <button
            onClick={onToggleDarkMode}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{t("profile.darkMode")}</span>
            </div>
            <div
              className={`w-11 h-6 rounded-full relative transition-colors ${isDarkMode ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
            >
              <div
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isDarkMode ? "translate-x-5" : "translate-x-0"}`}
              />
            </div>
          </button>

          {/* Notifications */}
          <div className="border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setExpandedSection((p) => (p === "notifications" ? null : "notifications"))}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                  <Bell className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{t("profile.notifications")}</span>
              </div>
              {expandedSection === "notifications" ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <AnimatePresence>
              {expandedSection === "notifications" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="px-4 py-2 space-y-1">
                    {(
                      [
                        { id: "messages", label: t("notifPrefs.messageNotifications") },
                        { id: "sound", label: t("notifPrefs.sound") },
                        { id: "preview", label: t("notifPrefs.messagePreview") },
                        { id: "groups", label: t("notifPrefs.groupNotifications") },
                        { id: "mentions", label: t("notifPrefs.mentionNotifications") },
                      ] as const
                    ).map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                        <button
                          onClick={() => handleNotifToggle(item.id)}
                          className={`w-11 h-6 rounded-full relative transition-colors ${notifPrefs[item.id] ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
                        >
                          <div
                            className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notifPrefs[item.id] ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </button>
                      </div>
                    ))}

                    {/* Message Sound Type Selector */}
                    <div className="pt-3 pb-2 border-t border-gray-200 dark:border-gray-700">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                        Message Sound
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(SOUND_NAMES).map(([key, name]) => {
                          const soundType = key as NotificationSoundType;
                          const isSelected = (notifPrefs.messageSoundType || "ding") === soundType;
                          return (
                            <button
                              key={key}
                              onClick={() => handleSoundTypeChange("message", soundType)}
                              className={`relative flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                                isSelected
                                  ? "bg-primary text-white"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                              }`}
                            >
                              <span className="truncate">{name}</span>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await playNotificationSound(soundType);
                                }}
                                className="ml-2 p-1 rounded-full hover:bg-white/20"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Call Sound Type Selector */}
                    <div className="pt-3 pb-2 border-t border-gray-200 dark:border-gray-700">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                        Call Sound
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(SOUND_NAMES).map(([key, name]) => {
                          const soundType = key as NotificationSoundType;
                          const isSelected = (notifPrefs.callSoundType || "chime") === soundType;
                          return (
                            <button
                              key={key}
                              onClick={() => handleSoundTypeChange("call", soundType)}
                              className={`relative flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                                isSelected
                                  ? "bg-primary text-white"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                              }`}
                            >
                              <span className="truncate">{name}</span>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await playNotificationSound(soundType);
                                }}
                                className="ml-2 p-1 rounded-full hover:bg-white/20"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Test Sound Button */}
                    <div className="pt-2 pb-1">
                      <button
                        onClick={async () => {
                          console.log("Test sound clicked, current settings:", notifPrefs);
                          const soundType = (notifPrefs.messageSoundType || "ding") as NotificationSoundType;
                          await playMessageSound(notifPrefs, soundType);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                        Test Message Sound
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Language */}
          <div className="border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setExpandedSection((p) => (p === "language" ? null : "language"))}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{t("profile.language")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {language === "en" ? t("common.english") : t("common.vietnamese")}
                </span>
                {expandedSection === "language" ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
            <AnimatePresence>
              {expandedSection === "language" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="px-4 py-2 space-y-1">
                    {(
                      [
                        { id: "en", label: t("common.english") },
                        { id: "vi", label: t("common.vietnamese") },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setLanguage(item.id)}
                        className="w-full flex items-center justify-between py-3 text-left"
                      >
                        <span
                          className={`text-sm ${language === item.id ? "text-primary font-medium" : "text-gray-700 dark:text-gray-300"}`}
                        >
                          {item.label}
                        </span>
                        {language === item.id && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Privacy */}
          <div>
            <button
              onClick={() => setExpandedSection((p) => (p === "privacy" ? null : "privacy"))}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("profile.privacySecurity")}
                </span>
              </div>
              {expandedSection === "privacy" ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <AnimatePresence>
              {expandedSection === "privacy" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="px-4 py-2 space-y-1">
                    {(
                      [
                        { id: "onlineStatus", label: t("privacyPrefs.showOnlineStatus") },
                        { id: "readReceipts", label: t("privacyPrefs.showReadReceipts") },
                        { id: "allowRequests", label: t("privacyPrefs.allowFriendRequests") },
                      ] as const
                    ).map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                        <button
                          onClick={() => setPrivacyPrefs((p: any) => ({ ...p, [item.id]: !p[item.id] }))}
                          className={`w-11 h-6 rounded-full relative transition-colors ${privacyPrefs[item.id] ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
                        >
                          <div
                            className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${privacyPrefs[item.id] ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mt-4 mb-6 bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          {t("profile.logOut")}
        </button>
      </div>

      <div className="text-center pb-6">
        <p className="text-xs text-gray-400 dark:text-gray-500">{t("profile.version")}</p>
      </div>
    </div>
  );
};
