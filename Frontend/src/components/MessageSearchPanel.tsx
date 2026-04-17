import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Message } from '../types';
import { useAppSelector } from '../store/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useTranslation } from '../i18n/LanguageContext';
interface MessageSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}
export const MessageSearchPanel: React.FC<MessageSearchPanelProps> = ({
  isOpen,
  onClose,
  conversationId
}) => {
  const { t } = useTranslation();
  const allMessages = useAppSelector((s) => s.messages.byConvId[conversationId] ?? []);
  const friends = useAppSelector((s) => s.friends.friends);
  const users: Record<string, { name: string; avatar: string }> = {};
  friends.forEach((f) => { users[f.id] = { name: f.name, avatar: f.avatar }; });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const q = query.toLowerCase();
    const filtered = allMessages.filter((m) =>
      !m.isRecalled && m.content?.toLowerCase().includes(q)
    );
    setResults(filtered);
    setIsSearching(false);
  }, [query, allMessages]);
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{
          y: -20,
          opacity: 0
        }}
        animate={{
          y: 0,
          opacity: 1
        }}
        exit={{
          y: -20,
          opacity: 0
        }}
        className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-md dark:shadow-gray-900/50 z-20">
        
        <div className="p-3 flex items-center gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              autoFocus
              placeholder={t('chat.searchInConversation')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)} />
            
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            
            <X className="w-5 h-5" />
          </button>
        </div>

        {query.trim() &&
        <div className="max-h-64 overflow-y-auto custom-scrollbar border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {isSearching ?
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                {t('chat.searching')}
              </div> :
          results.length > 0 ?
          <div className="max-w-4xl mx-auto">
                {results.map((msg) => {
              const sender = users[msg.senderId];
              return (
                <div
                  key={msg.id}
                  className="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={onClose}>
                  
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {sender?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(msg.timestamp), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {msg.content}
                      </p>
                    </div>);

            })}
              </div> :

          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                {t('chat.noMessagesFound')} "{query}"
              </div>
          }
          </div>
        }
      </motion.div>
    </AnimatePresence>);

};