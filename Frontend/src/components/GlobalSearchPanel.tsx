import React, { useEffect, useState } from 'react';
import {
  Search,
  X,
  User as UserIcon,
  MessageCircle,
  MessageSquare } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { userService } from '../services/user.service';
import { mapUser } from '../types/mappers';
import { useAppSelector } from '../store/hooks';
import { User, Conversation, Message } from '../types';
import { format } from 'date-fns';
import { useTranslation } from '../i18n/LanguageContext';
interface GlobalSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConversation: (convId: string) => void;
  onOpenChat: (userId: string) => void;
}
export const GlobalSearchPanel: React.FC<GlobalSearchPanelProps> = ({
  isOpen,
  onClose,
  onOpenConversation,
  onOpenChat
}) => {
  const { t } = useTranslation();
  const allConversations = useAppSelector((s) => s.conversations.items);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    users: User[];
    conversations: Conversation[];
    messages: (Message & { conversationName: string })[];
  }>({ users: [], conversations: [], messages: [] });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (query.trim().length < 2) {
        setResults({ users: [], conversations: [], messages: [] });
        return;
      }
      setIsSearching(true);
      try {
        const dtos = await userService.search(query);
        const users = dtos.map(mapUser);
        const q = query.toLowerCase();
        const conversations = allConversations.filter((c) =>
          (c.isGroup ? (c.groupName ?? '') : c.user.name).toLowerCase().includes(q)
        );
        setResults({ users, conversations, messages: [] });
      } catch {
        setResults({ users: [], conversations: [], messages: [] });
      } finally {
        setIsSearching(false);
      }
    };
    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [query, allConversations]);
  if (!isOpen) return null;
  const hasResults =
  results.users.length > 0 ||
  results.conversations.length > 0 ||
  results.messages.length > 0;
  return (
    <AnimatePresence>
      <motion.div
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900 md:bg-black/50 md:p-4 md:items-center md:justify-start">
        
        <motion.div
          initial={{
            y: -20,
            scale: 0.95
          }}
          animate={{
            y: 0,
            scale: 1
          }}
          exit={{
            y: -20,
            scale: 0.95
          }}
          className="w-full h-full md:h-auto md:max-h-[80vh] md:max-w-2xl bg-white dark:bg-gray-900 md:rounded-xl shadow-2xl flex flex-col overflow-hidden">
          
          {/* Search Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                autoFocus
                placeholder={t('globalSearch.placeholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-base focus:ring-primary focus:border-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors" />
              
            </div>
            <button
              onClick={onClose}
              className="p-3 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
              
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {query.trim().length < 2 ?
            <div className="p-8 text-center flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p>{t('globalSearch.minChars')}</p>
              </div> :
            isSearching ?
            <div className="p-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div> :
            !hasResults ?
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {t('globalSearch.noResults')} "{query}"
              </div> :

            <div className="space-y-4 p-2">
                {/* Users Results */}
                {results.users.length > 0 &&
              <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
                      {t('globalSearch.people')}
                    </h3>
                    <div className="space-y-1">
                      {results.users.map((user) =>
                  <div
                    key={user.id}
                    onClick={() => {
                      onOpenChat(user.id);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                    
                          <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full" />
                    
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user.statusMessage || t('status.available')}
                            </p>
                          </div>
                        </div>
                  )}
                    </div>
                  </div>
              }

                {/* Conversations Results */}
                {results.conversations.length > 0 &&
              <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2 mt-4">
                      {t('globalSearch.groupsChats')}
                    </h3>
                    <div className="space-y-1">
                      {results.conversations.map((conv) =>
                  <div
                    key={conv.id}
                    onClick={() => {
                      onOpenConversation(conv.id);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                    
                          <div className="w-10 h-10 rounded-full bg-primary-light dark:bg-primary-dark-light flex items-center justify-center text-primary">
                            {conv.isGroup ?
                      <UsersIcon className="w-5 h-5" /> :

                      <UserIcon className="w-5 h-5" />
                      }
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {conv.isGroup ? conv.groupName : conv.user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {conv.isGroup ?
                        t('globalSearch.group') :
                        t('globalSearch.directMessage')}
                            </p>
                          </div>
                        </div>
                  )}
                    </div>
                  </div>
              }

                {/* Messages Results */}
                {results.messages.length > 0 &&
              <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2 mt-4">
                      {t('globalSearch.messages')}
                    </h3>
                    <div className="space-y-1">
                      {results.messages.map((msg) =>
                  <div
                    key={msg.id}
                    onClick={() => {
                      onOpenConversation(msg.conversationId);
                      onClose();
                    }}
                    className="flex flex-col gap-1 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                    
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs font-semibold text-primary">
                              {msg.conversationName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(msg.timestamp), 'MMM d, HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                            {msg.content}
                          </p>
                        </div>
                  )}
                    </div>
                  </div>
              }
              </div>
            }
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>);

};
// Import missing icon
import { Users as UsersIcon } from 'lucide-react';