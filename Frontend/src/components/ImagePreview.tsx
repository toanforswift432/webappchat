import React from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n/LanguageContext';
interface ImagePreviewProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onSend: () => void;
}
export const ImagePreview: React.FC<ImagePreviewProps> = ({
  isOpen,
  imageUrl,
  onClose,
  onSend
}) => {
  const { t } = useTranslation();
  if (!isOpen || !imageUrl) return null;
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
        
        <motion.div
          initial={{
            scale: 0.9,
            opacity: 0
          }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          exit={{
            scale: 0.9,
            opacity: 0
          }}
          className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden max-w-2xl w-full flex flex-col shadow-2xl dark:shadow-gray-900/50">
          
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('modal.previewImage')}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-center items-center min-h-[300px] max-h-[60vh] overflow-hidden">
            <img
              src={imageUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm dark:shadow-none" />
            
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-white dark:bg-gray-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">
              
              {t('common.cancel')}
            </button>
            <button
              onClick={() => {
                onSend();
                onClose();
              }}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center gap-2">
              
              <Send className="w-4 h-4" />
              {t('modal.sendImage')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>);

};