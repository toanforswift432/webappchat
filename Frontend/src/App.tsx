import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { EmptyState } from './components/EmptyState';
import { ForwardModal } from './components/ForwardModal';
import { BottomNav } from './components/BottomNav';
import { NotificationPanel } from './components/NotificationPanel';
import { GlobalSearchPanel } from './components/GlobalSearchPanel';
import { VideoCallModal } from './components/VideoCallModal';
import { IncomingCallModal } from './components/IncomingCallModal';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ContactsPage } from './pages/ContactsPage';
import { ProfilePage } from './pages/ProfilePage';
import { useTranslation } from './i18n/LanguageContext';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { logout } from './store/slices/authSlice';
import {
  fetchConversations,
  setActiveConversation,
  getOrCreateDirect,
  createGroup,
} from './store/slices/conversationSlice';
import {
  fetchMessages,
  sendMessage,
  recallMessage,
} from './store/slices/messageSlice';
import {
  setActiveTab,
  toggleDarkMode,
  setNotificationsOpen,
  setSearchOpen,
  setMessageToForward,
} from './store/slices/uiSlice';
import { useSignalR } from './hooks/useSignalR';
import type { Message } from './types';
import { MessageType } from './types/api';
import { Account } from './types';

type AuthView = 'login' | 'register';

export function App() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { isAuthenticated, user, status: authStatus } = useAppSelector((s) => s.auth);
  const { items: conversations, activeId: activeConvId } = useAppSelector((s) => s.conversations);
  const { byConvId, loadingConvIds } = useAppSelector((s) => s.messages);
  const { activeTab, isDarkMode, isNotificationsOpen, isSearchOpen, messageToForward, typingConvIds } = useAppSelector((s) => s.ui);

  const [authView, setAuthView] = React.useState<AuthView>('login');

  useSignalR();

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchConversations());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeConvId) {
      dispatch(fetchMessages(activeConvId));
    }
  }, [activeConvId]);

  const handleLogout = async () => {
    dispatch(logout());
    dispatch(setActiveConversation(null));
    dispatch(setActiveTab('chat'));
  };

  const handleOpenChat = async (userId: string) => {
    dispatch(setSearchOpen(false));
    const existing = conversations.find((c) => !c.isGroup && c.user.id === userId);
    if (existing) {
      dispatch(setActiveConversation(existing.id));
    } else {
      await dispatch(getOrCreateDirect(userId));
    }
    dispatch(setActiveTab('chat'));
  };

  const handleOpenConversation = (convId: string) => {
    dispatch(setSearchOpen(false));
    dispatch(setActiveConversation(convId));
    dispatch(setActiveTab('chat'));
  };

  const handleSendMessage = async (
    content: string,
    type: 'text' | 'image' | 'file' | 'sticker' | 'poll',
    _fileData?: { name: string; size: string },
    replyTo?: Message
  ) => {
    if (!activeConvId) return;

    const typeMap: Record<string, MessageType> = {
      text: MessageType.Text,
      image: MessageType.Image,
      file: MessageType.File,
      sticker: MessageType.Sticker,
      poll: MessageType.Poll,
    };

    dispatch(sendMessage({
      conversationId: activeConvId,
      type: typeMap[type] ?? MessageType.Text,
      content: type === 'text' ? content : null,
      options: {
        fileUrl: type !== 'text' ? content : undefined,
        fileName: _fileData?.name,
        replyToMessageId: replyTo?.id,
      },
    }));
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

  const handlePinToggle = async (_msgId: string) => {
    // TODO: backend endpoint for pin
  };

  const handleReact = async (_msgId: string, _emoji: string) => {
    // TODO: backend endpoint for reactions
  };

  const handleForward = async (_msgId: string, _targetConvId: string) => {
    // TODO: backend endpoint for forward
    dispatch(setMessageToForward(null));
  };

  const handleRecall = async (msgId: string) => {
    if (!activeConvId) return;
    dispatch(recallMessage({ conversationId: activeConvId, messageId: msgId }));
  };

  const handleVote = async (_msgId: string, _optionId: string) => {
    // TODO: backend endpoint for poll vote
  };

  if (!isAuthenticated) {
    if (authView === 'login') {
      return <LoginPage onLoginSuccess={() => {}} onSwitchToRegister={() => setAuthView('register')} />;
    }
    return <RegisterPage onRegisterSuccess={() => {}} onSwitchToLogin={() => setAuthView('login')} />;
  }

  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const messages = activeConvId ? (byConvId[activeConvId] ?? []) : [];
  const isTyping = activeConvId ? typingConvIds.includes(activeConvId) : false;
  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const isMobileChatActive = activeTab === 'chat' && activeConvId !== null;
  const showBottomNav = !isMobileChatActive;

  const currentAccount: Account = user
    ? { id: user.id, email: user.email, name: user.displayName, avatar: '', createdAt: '' }
    : { id: '', email: '', name: '', avatar: '', createdAt: '' };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-gray-900 overflow-hidden font-sans transition-colors duration-200">
      <div className={`flex-1 flex flex-col relative ${showBottomNav ? 'pb-14' : ''}`}>

        {activeTab === 'chat' && (
          <div className="flex flex-1 h-full overflow-hidden relative">
            <Sidebar
              conversations={conversations}
              activeConversationId={activeConvId}
              onSelectConversation={(id) => dispatch(setActiveConversation(id))}
              onCreateGroup={handleCreateGroup}
              isMobileHidden={activeConvId !== null}
              onOpenSearch={() => dispatch(setSearchOpen(true))}
              onOpenNotifications={() => dispatch(setNotificationsOpen(!isNotificationsOpen))}
              unreadNotificationCount={0}
            />

            <NotificationPanel
              isOpen={isNotificationsOpen}
              onClose={() => dispatch(setNotificationsOpen(false))}
              notifications={[]}
              onMarkRead={async () => {}}
              onMarkAllRead={async () => {}}
              onNotificationClick={async () => {}}
            />

            <div className={`flex-1 flex-col relative ${activeConvId === null ? 'hidden md:flex' : 'flex'}`}>
              {activeConversation ? (
                <ChatArea
                  conversation={activeConversation}
                  messages={messages}
                  currentUserId={user?.id ?? ''}
                  isTyping={isTyping}
                  onSendMessage={handleSendMessage}
                  onBack={() => dispatch(setActiveConversation(null))}
                  onUpdateGroupMembers={handleUpdateGroupMembers}
                  onRemoveGroup={handleRemoveGroup}
                  onPinToggle={handlePinToggle}
                  onReact={handleReact}
                  onForward={(msg) => dispatch(setMessageToForward(msg))}
                  onRecall={handleRecall}
                  onVote={handleVote}
                />
              ) : (
                <>
                  <div className="hidden h-16 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 md:flex items-center shadow-sm absolute top-0 w-full z-10 transition-colors duration-200">
                    <span className="font-semibold text-primary">Z-Chat</span>
                  </div>
                  <EmptyState />
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <ContactsPage onOpenChat={handleOpenChat} />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            account={currentAccount}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => dispatch(toggleDarkMode())}
            onLogout={handleLogout}
          />
        )}
      </div>

      <div className={`${!showBottomNav ? 'hidden md:block' : 'block'}`}>
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => dispatch(setActiveTab(tab))}
          unreadCount={totalUnreadCount}
          pendingRequestCount={0}
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
    </div>
  );
}
