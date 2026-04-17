import React, { useEffect, useState, useRef } from 'react';
import {
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Users,
  Pin,
  ChevronDown,
  ChevronUp,
  Search,
  Paperclip } from
'lucide-react';
import { Conversation, Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { ImagePreview } from './ImagePreview';
import { GroupManageModal } from './GroupManageModal';
import { SharedFilesPanel } from './SharedFilesPanel';
import { MessageSearchPanel } from './MessageSearchPanel';
import { CreatePollModal } from './CreatePollModal';
import { useAppSelector } from '../store/hooks';
import { useTranslation } from '../i18n/LanguageContext';
import { useCall } from '../hooks/useCall';
interface ChatAreaProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  isTyping: boolean;
  onSendMessage: (
  content: string,
  type: 'text' | 'image' | 'file' | 'sticker' | 'poll',
  fileData?: {
    name: string;
    size: string;
  },
  replyTo?: Message,
  pollData?: {
    question: string;
    options: {
      id: string;
      text: string;
      votes: string[];
    }[];
  })
  => void;
  onBack: () => void;
  onUpdateGroupMembers: (groupId: string, memberIds: string[]) => void;
  onRemoveGroup: (groupId: string) => void;
  onPinToggle: (msgId: string) => void;
  onReact: (msgId: string, emoji: string) => void;
  onForward: (msg: Message) => void;
  onRecall: (msgId: string) => void;
  onVote: (msgId: string, optionId: string) => void;
}
export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  currentUserId,
  isTyping,
  onSendMessage,
  onBack,
  onUpdateGroupMembers,
  onRemoveGroup,
  onPinToggle,
  onReact,
  onForward,
  onRecall,
  onVote
}) => {
  const { t } = useTranslation();
  const friends = useAppSelector((s) => s.friends.friends);
  const conversationMembers = conversation.members ?? [];
  const users: Record<string, { name: string; avatar: string }> = {};
  [...friends, ...conversationMembers, conversation.user].forEach((u) => {
    if (u && 'id' in u) users[u.id] = { name: u.name, avatar: u.avatar };
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showAllPinned, setShowAllPinned] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSharedFilesOpen, setIsSharedFilesOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const pinnedMessages = messages.filter((m) => m.isPinned);

  // Call functionality
  const { initiateCall } = useCall();

  const handleStartAudioCall = () => {
    initiateCall(conversation.id, 'audio');
  };

  const handleStartVideoCall = () => {
    initiateCall(conversation.id, 'video');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
    } else {
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      onSendMessage(
        '#',
        'file',
        {
          name: file.name,
          size: sizeStr
        },
        replyingTo || undefined
      );
      setReplyingTo(null);
    }
  };
  const handleSendMessage = (
  content: string,
  type: 'text' | 'image' | 'file' | 'sticker' | 'poll',
  fileData?: {
    name: string;
    size: string;
  },
  pollData?: {
    question: string;
    options: {
      id: string;
      text: string;
      votes: string[];
    }[];
  }) =>
  {
    onSendMessage(content, type, fileData, replyingTo || undefined, pollData);
    setReplyingTo(null);
  };
  const handleCreatePoll = (question: string, options: string[]) => {
    const pollData = {
      question,
      options: options.map((opt, index) => ({
        id: `opt-${Date.now()}-${index}`,
        text: opt,
        votes: []
      }))
    };
    handleSendMessage('Poll', 'poll', undefined, pollData);
  };
  const displayName = conversation.isGroup ?
  conversation.groupName :
  conversation.user.name;
  const displayAvatar = conversation.isGroup ?
  conversation.groupAvatar :
  conversation.user.avatar;
  const displayStatus = conversation.isGroup ?
  `${conversation.members?.length || 0} members` :
  conversation.user.isOnline ?
  'Active now' :
  'Offline';
  return (
    <div
      className="flex-1 flex flex-col h-full bg-[#e5e7eb] dark:bg-gray-800 relative w-full transition-colors duration-200"
      onDragOver={handleDragOver}
      onDrop={handleDrop}>

      {/* Header */}
      <div className="h-16 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-sm z-10 transition-colors duration-200">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="md:hidden mr-3 p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">

            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative">
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />

            {!conversation.isGroup && conversation.user.isOnline &&
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            }
          </div>
          <div className="ml-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {displayName}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {displayStatus}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {conversation.isGroup &&
          <button
            onClick={() => setIsManageModalOpen(true)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors"
            title="Manage Group">

              <Users className="w-5 h-5" />
            </button>
          }
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            title={t('common.search')}>

            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsSharedFilesOpen(true)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors hidden sm:block"
            title={t('sharedFiles.title')}>

            <Paperclip className="w-5 h-5" />
          </button>
          <button
            onClick={handleStartAudioCall}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors hidden sm:block"
            title="Start audio call">
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={handleStartVideoCall}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors hidden sm:block"
            title="Start video call">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <MessageSearchPanel
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        conversationId={conversation.id} />


      {/* Pinned Messages Bar */}
      {pinnedMessages.length > 0 &&
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-10 transition-colors duration-200">
          <div
          className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          onClick={() => setShowAllPinned(!showAllPinned)}>

            <div className="flex items-center gap-2 overflow-hidden">
              <Pin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {pinnedMessages.length}{' '}
                {pinnedMessages.length === 1 ?
              t('chat.pinnedMessage') :
              t('chat.pinnedMessages_plural')}
              </span>
            </div>
            <button
            onClick={() => setShowAllPinned(!showAllPinned)}
            className="text-xs text-primary hover:underline flex items-center">

              {showAllPinned ? t('chat.showLess') : t('chat.showAll')}
              {showAllPinned ?
            <ChevronUp className="w-3 h-3 ml-1" /> :

            <ChevronDown className="w-3 h-3 ml-1" />
            }
            </button>
          </div>

          {showAllPinned &&
        <div className="max-h-40 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
              {pinnedMessages.map((msg) =>
          <div
            key={msg.id}
            className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-start group transition-colors">

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {users[msg.senderId]?.name || 'Unknown'}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {msg.content}
                    </span>
                  </div>
                  <button
              onClick={(e) => {
                e.stopPropagation();
                onPinToggle(msg.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-all">

                    Unpin
                  </button>
                </div>
          )}
            </div>
        }
        </div>
      }

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#f3f4f6] dark:bg-gray-800 transition-colors duration-200">
        <div className="max-w-4xl mx-auto flex flex-col">
          {messages.map((msg) =>
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === currentUserId}
            users={users}
            onReply={setReplyingTo}
            onPinToggle={onPinToggle}
            onReact={onReact}
            onForward={onForward}
            onRecall={onRecall}
            onVote={onVote}
            currentUserId={currentUserId} />

          )}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput
        onSendMessage={onSendMessage}
        onImageSelect={(url) => {
          setPreviewImage(url);
        }}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        isGroup={conversation.isGroup}
        onCreatePoll={() => setIsCreatePollOpen(true)}
        members={conversation.isGroup ? conversation.members : undefined} />


      {/* Image Preview Modal */}
      <ImagePreview
        isOpen={!!previewImage}
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
        onSend={() => {
          if (previewImage) {
            onSendMessage(previewImage, 'image');
          }
        }} />


      {/* Group Manage Modal */}
      {conversation.isGroup &&
      <GroupManageModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        group={conversation}
        currentUserId={currentUserId}
        onUpdateMembers={(memberIds) =>
        onUpdateGroupMembers(conversation.id, memberIds)
        }
        onRemoveGroup={() => onRemoveGroup(conversation.id)} />

      }

      <SharedFilesPanel
        isOpen={isSharedFilesOpen}
        onClose={() => setIsSharedFilesOpen(false)}
        messages={messages} />


      <CreatePollModal
        isOpen={isCreatePollOpen}
        onClose={() => setIsCreatePollOpen(false)}
        onCreate={handleCreatePoll} />

    </div>);

};