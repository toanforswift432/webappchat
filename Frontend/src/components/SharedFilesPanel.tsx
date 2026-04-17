import React, { useState, lazy } from 'react';
import { X, FileText, Download } from 'lucide-react';
import { Message } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useTranslation } from '../i18n/LanguageContext';
interface SharedFilesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
}
export const SharedFilesPanel: React.FC<SharedFilesPanelProps> = ({
  isOpen,
  onClose,
  messages
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'images' | 'files'>('images');
  const images = messages.filter((m) => m.type === 'image');
  const files = messages.filter((m) => m.type === 'file');
  return (
    <AnimatePresence>
      {isOpen &&
      <motion.div
        initial={{
          x: '100%'
        }}
        animate={{
          x: 0
        }}
        exit={{
          x: '100%'
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 200
        }}
        className="absolute inset-y-0 right-0 w-full md:w-80 bg-white dark:bg-gray-800 shadow-2xl dark:shadow-gray-900/50 border-l border-gray-200 dark:border-gray-700 z-30 flex flex-col">
        
          <div className="h-16 px-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t('sharedFiles.title')}
            </h2>
            <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button
            onClick={() => setActiveTab('images')}
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'images' ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            
              {t('sharedFiles.images')} ({images.length})
            </button>
            <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'files' ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            
              {t('sharedFiles.files')} ({files.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeTab === 'images' ?
          <div className="grid grid-cols-3 gap-2">
                {images.map((img) =>
            <div
              key={img.id}
              className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              
                    <img
                src={img.content}
                alt="Shared"
                className="w-full h-full object-cover"
                loading="lazy" />
              
                  </div>
            )}
                {images.length === 0 &&
            <p className="col-span-3 text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                    {t('sharedFiles.noImages')}
                  </p>
            }
              </div> :

          <div className="flex flex-col gap-3">
                {files.map((file) =>
            <div
              key={file.id}
              className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              
                    <div className="p-2 bg-white dark:bg-gray-600 rounded-full shadow-sm dark:shadow-none">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.fileName}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2 mt-0.5">
                        <span>{file.fileSize}</span>
                        <span>•</span>
                        <span>{format(new Date(file.timestamp), 'MMM d')}</span>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary hover:bg-primary-light dark:hover:bg-primary-dark-light rounded-full transition-colors ml-2">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
            )}
                {files.length === 0 &&
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                    {t('sharedFiles.noFiles')}
                  </p>
            }
              </div>
          }
          </div>
        </motion.div>
      }
    </AnimatePresence>);

};