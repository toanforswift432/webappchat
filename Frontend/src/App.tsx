import React, { useEffect, useState, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { EmptyState } from "./components/EmptyState";
import { ForwardModal } from "./components/ForwardModal";
import { BottomNav } from "./components/BottomNav";
import { NotificationPanel } from "./components/NotificationPanel";
import { GlobalSearchPanel } from "./components/GlobalSearchPanel";
import { VideoCallModal } from "./components/VideoCallModal";
import { IncomingCallModal } from "./components/IncomingCallModal";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ContactsPage } from "./pages/ContactsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPage } from "./pages/AdminPage";
import { useTranslation } from "./i18n/LanguageContext";
import { conversationService } from "./services/conversation.service";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { logout } from "./store/slices/authSlice";
import {
  fetchConversations,
  setActiveConversation,
  getOrCreateDirect,
  createGroup,
} from "./store/slices/conversationSlice";
import {
  fetchMessages,
  sendMessage,
  recallMessage,
  deleteMessage,
  forwardMessage,
  toggleMessageReaction,
  setPinned,
} from "./store/slices/messageSlice";
import {
  setActiveTab,
  toggleDarkMode,
  setNotificationsOpen,
  setSearchOpen,
  setMessageToForward,
  markNotificationRead,
  markAllNotificationsRead,
} from "./store/slices/uiSlice";
import { useSignalR, getSignalRConnection } from "./hooks/useSignalR";
import { fetchFriendRequests } from "./store/slices/friendSlice";
import type { Message } from "./types";
import { MessageType, AccountType } from "./types/api";
import { Account } from "./types";
import { ToastContainer, ToastData, ToastType } from "./components/Toast";

type AuthView = "login" | "register";

function getInviteCodeFromUrl(): string | null {
  const match = window.location.pathname.match(/\/webchatapp\/([^/]+)$/);
  return match ? match[1] : null;
}

export function App() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { isAuthenticated, user, status: authStatus } = useAppSelector((s) => s.auth);
  const { items: conversations, activeId: activeConvId } = useAppSelector((s) => s.conversations);
  const { byConvId, loadingConvIds } = useAppSelector((s) => s.messages);
  const { activeTab, isDarkMode, isNotificationsOpen, isSearchOpen, messageToForward, typingConvIds, notifications } = useAppSelector(
    (s) => s.ui,
  );
  const pendingRequestCount = useAppSelector((s) => s.friends.requestDetails.length);

  const inviteCode = React.useMemo(() => getInviteCodeFromUrl(), []);
  const [authView, setAuthView] = React.useState<AuthView>(() => (inviteCode ? "register" : "login"));
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const showToast = useCallback((message: string, type: ToastType = "warning") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useSignalR();

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchConversations());
      dispatch(fetchFriendRequests());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeConvId) {
      dispatch(fetchMessages(activeConvId));
      getSignalRConnection()?.invoke("MarkRead", activeConvId);
    }
  }, [activeConvId]);

  const handleLogout = async () => {
    dispatch(logout());
    dispatch(setActiveConversation(null));
    dispatch(setActiveTab("chat"));
  };

  const handleOpenChat = async (userId: string) => {
    dispatch(setSearchOpen(false));
    const existing = conversations.find((c) => !c.isGroup && c.user.id === userId);
    if (existing) {
      dispatch(setActiveConversation(existing.id));
    } else {
      await dispatch(getOrCreateDirect(userId));
    }
    dispatch(setActiveTab("chat"));
  };

  const handleOpenConversation = (convId: string) => {
    dispatch(setSearchOpen(false));
    dispatch(setActiveConversation(convId));
    dispatch(setActiveTab("chat"));
  };

  const handleSendMessage = async (
    content: string,
    type: "text" | "image" | "file" | "sticker" | "poll",
    _fileData?: { name: string; size: string },
    replyTo?: Message,
  ) => {
    if (!activeConvId) return;

    const typeMap: Record<string, MessageType> = {
      text: MessageType.Text,
      image: MessageType.Image,
      file: MessageType.File,
      sticker: MessageType.Sticker,
      poll: MessageType.Poll,
    };

    dispatch(
      sendMessage({
        conversationId: activeConvId,
        type: typeMap[type] ?? MessageType.Text,
        content: type === "text" ? content : null,
        options: {
          fileUrl: type !== "text" ? content : undefined,
          fileName: _fileData?.name,
          replyToMessageId: replyTo?.id,
        },
      }),
    );
  };

  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    dispatch(createGroup({ name, memberIds }));
  };

  const handleUpdateGroupMembers = async (_groupId: string, _memberIds: string[]) => {
    // TODO: backend endpoint for updating group members
  };

  const handleRemoveGroup = async (_groupId: string) => {
    // TODO: backend endpoint for leaving/removing group
  };

  const handlePinToggle = async (msgId: string) => {
    if (!activeConvId) return;
    try {
      const { isPinned } = await conversationService.pinMessage(activeConvId, msgId);
      dispatch(setPinned({ messageId: msgId, conversationId: activeConvId, isPinned }));
    } catch (err: any) {
      const msg: string = err.response?.data?.error ?? "";
      if (err.response?.status === 400 && (msg.includes("3") || msg.toLowerCase().includes("pin"))) {
        showToast("Chỉ có thể ghim tối đa 3 tin nhắn", "warning");
      } else {
        showToast(msg || "Không thể ghim tin nhắn", "error");
      }
    }
  };

  const handleReact = async (msgId: string, emoji: string) => {
    if (!activeConvId || !user) return;
    try {
      const result = await conversationService.toggleReaction(activeConvId, msgId, emoji);
      // Update local state immediately for sender (SignalR will update others)
      dispatch(
        toggleMessageReaction({
          conversationId: activeConvId,
          messageId: msgId,
          userId: user.id,
          emoji,
          added: result.added,
        }),
      );
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  };

  const handleForward = async (msgId: string, targetConvId: string) => {
    if (!activeConvId) return;
    await dispatch(
      forwardMessage({ conversationId: activeConvId, messageId: msgId, targetConversationId: targetConvId }),
    );
    dispatch(setMessageToForward(null));
  };

  const handleRecall = async (msgId: string) => {
    if (!activeConvId) return;
    dispatch(recallMessage({ conversationId: activeConvId, messageId: msgId }));
  };

  const handleDelete = async (msgId: string) => {
    if (!activeConvId) return;
    dispatch(deleteMessage({ conversationId: activeConvId, messageId: msgId }));
  };

  const handleVote = async (_msgId: string, _optionId: string) => {
    // TODO: backend endpoint for poll vote
  };

  if (!isAuthenticated) {
    if (authView === "login") {
      return <LoginPage onLoginSuccess={() => {}} onSwitchToRegister={() => setAuthView("register")} />;
    }
    return (
      <RegisterPage
        onRegisterSuccess={() => setAuthView("login")}
        onSwitchToLogin={() => setAuthView("login")}
        inviteCode={inviteCode ?? undefined}
      />
    );
  }

  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const messages = activeConvId ? (byConvId[activeConvId] ?? []) : [];
  const isTyping = activeConvId ? typingConvIds.includes(activeConvId) : false;
  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const unreadConvsCount = conversations.filter((c) => (c.unreadCount || 0) > 0).length;
  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;
  const isMobileChatActive = activeTab === "chat" && activeConvId !== null;
  const showBottomNav = !isMobileChatActive;

  const currentAccount: Account = user
    ? { id: user.id, email: user.email, password: "", name: user.displayName, avatar: "", createdAt: "" }
    : { id: "", email: "", password: "", name: "", avatar: "", createdAt: "" };

  return (
    <div className="flex h-dvh w-full bg-white dark:bg-gray-900 overflow-hidden font-sans transition-colors duration-200 pt-safe">
      <div className={`flex-1 flex flex-col relative ${showBottomNav ? "pb-nav-safe" : ""}`}>
        {activeTab === "chat" && (
          <div className="flex flex-1 h-full overflow-hidden relative">
            <Sidebar
              conversations={conversations}
              activeConversationId={activeConvId}
              onSelectConversation={(id) => dispatch(setActiveConversation(id))}
              onCreateGroup={handleCreateGroup}
              isMobileHidden={activeConvId !== null}
              onOpenSearch={() => dispatch(setSearchOpen(true))}
              onOpenNotifications={() => dispatch(setNotificationsOpen(!isNotificationsOpen))}
              unreadNotificationCount={unreadNotificationCount}
              activeTab={activeTab}
              onTabChange={(tab) => dispatch(setActiveTab(tab))}
              unreadCount={totalUnreadCount}
              pendingRequestCount={pendingRequestCount}
              isAdmin={user?.accountType === AccountType.Admin}
            />

            <NotificationPanel
              isOpen={isNotificationsOpen}
              onClose={() => dispatch(setNotificationsOpen(false))}
              notifications={notifications}
              onMarkRead={(id) => dispatch(markNotificationRead(id))}
              onMarkAllRead={() => dispatch(markAllNotificationsRead())}
              onNotificationClick={(notif) => {
                // Handle notification click - navigate to related content
                if (notif.type === "friend_request") {
                  dispatch(setActiveTab("contacts"));
                  dispatch(setNotificationsOpen(false));
                }
              }}
            />

            <div
              className={`flex-1 flex-col relative overflow-hidden ${activeConvId === null ? "hidden md:flex" : "flex"}`}
            >
              {activeConversation ? (
                <ChatArea
                  conversation={activeConversation}
                  messages={messages}
                  currentUserId={user?.id ?? ""}
                  isTyping={isTyping}
                  onSendMessage={handleSendMessage}
                  onBack={() => dispatch(setActiveConversation(null))}
                  onUpdateGroupMembers={handleUpdateGroupMembers}
                  onRemoveGroup={handleRemoveGroup}
                  onPinToggle={handlePinToggle}
                  onReact={handleReact}
                  onForward={(msg) => dispatch(setMessageToForward(msg))}
                  onRecall={handleRecall}
                  onDelete={handleDelete}
                  onVote={handleVote}
                />
              ) : (
                <>
                  <div className="hidden h-16 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 md:flex items-center shadow-sm absolute top-0 w-full z-10 transition-colors duration-200">
                    <span className="font-semibold text-primary">Ami Chat</span>
                  </div>
                  <EmptyState />
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <ContactsPage onOpenChat={handleOpenChat} onBack={() => dispatch(setActiveTab("chat"))} />
        )}

        {activeTab === "profile" && (
          <ProfilePage
            account={currentAccount}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => dispatch(toggleDarkMode())}
            onLogout={handleLogout}
            onBack={() => dispatch(setActiveTab("chat"))}
          />
        )}

        {activeTab === "admin" && user?.accountType === AccountType.Admin && (
          <AdminPage onBack={() => dispatch(setActiveTab("chat"))} />
        )}
      </div>

      <div className={`${!showBottomNav ? "hidden md:block" : "block"}`}>
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => dispatch(setActiveTab(tab))}
          unreadCount={totalUnreadCount}
          pendingRequestCount={pendingRequestCount}
          isAdmin={user?.accountType === AccountType.Admin}
        />
      </div>

      <ForwardModal
        isOpen={!!messageToForward}
        onClose={() => dispatch(setMessageToForward(null))}
        messageToForward={messageToForward}
        conversations={conversations}
        onForward={handleForward}
      />

      <GlobalSearchPanel
        isOpen={isSearchOpen}
        onClose={() => dispatch(setSearchOpen(false))}
        onOpenConversation={handleOpenConversation}
        onOpenChat={handleOpenChat}
      />

      {/* Video/Audio Call Modals */}
      <VideoCallModal />
      <IncomingCallModal />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
