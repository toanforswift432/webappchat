import React from 'react';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../i18n/LanguageContext';
export const EmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 p-6 text-center transition-colors duration-200">
      <motion.div
        initial={{
          scale: 0.8,
          opacity: 0
        }}
        animate={{
          scale: 1,
          opacity: 1
        }}
        transition={{
          duration: 0.5
        }}
        className="w-32 h-32 bg-primary-light dark:bg-primary-dark-light rounded-full flex items-center justify-center mb-6 transition-colors duration-200">
        
        <MessageSquare className="w-16 h-16 text-primary" />
      </motion.div>
      <motion.h2
        initial={{
          y: 20,
          opacity: 0
        }}
        animate={{
          y: 0,
          opacity: 1
        }}
        transition={{
          delay: 0.1,
          duration: 0.5
        }}
        className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">
        
        {t('empty.title')}
      </motion.h2>
      <motion.p
        initial={{
          y: 20,
          opacity: 0
        }}
        animate={{
          y: 0,
          opacity: 1
        }}
        transition={{
          delay: 0.2,
          duration: 0.5
        }}
        className="text-gray-500 dark:text-gray-400 max-w-md transition-colors duration-200">
        
        {t('empty.subtitle')}
      </motion.p>
    </div>);

};