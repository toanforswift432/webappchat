import React, { useState } from 'react';
import { X, Plus, Trash2, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n/LanguageContext';
interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (question: string, options: string[]) => void;
}
export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  if (!isOpen) return null;
  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };
  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  const handleCreate = () => {
    const validOptions = options.filter((o) => o.trim() !== '');
    if (question.trim() && validOptions.length >= 2) {
      onCreate(question.trim(), validOptions);
      setQuestion('');
      setOptions(['', '']);
      onClose();
    }
  };
  const isValid =
  question.trim() !== '' && options.filter((o) => o.trim() !== '').length >= 2;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <motion.div
          initial={{
            scale: 0.95,
            opacity: 0
          }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          exit={{
            scale: 0.95,
            opacity: 0
          }}
          className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md flex flex-col shadow-2xl dark:shadow-gray-900/50 max-h-[90vh]">
          
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              {t('modal.createPoll')}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('modal.question')}
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t('modal.questionPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                autoFocus />
              
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('modal.options')}
              </label>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
                {options.map((option, index) =>
                <div key={index} className="flex items-center gap-2">
                    <input
                    type="text"
                    value={option}
                    onChange={(e) =>
                    handleOptionChange(index, e.target.value)
                    }
                    placeholder={`${t('modal.optionPlaceholder')} ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors" />
                  
                    {options.length > 2 &&
                  <button
                    onClick={() => handleRemoveOption(index)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    
                        <Trash2 className="w-4 h-4" />
                      </button>
                  }
                  </div>
                )}
              </div>

              {options.length < 10 &&
              <button
                onClick={handleAddOption}
                className="mt-3 flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                
                  <Plus className="w-4 h-4" />
                  {t('modal.addOption')}
                </button>
              }
            </div>
            {options.length < 2 &&
            <p className="text-xs text-red-500 mt-2">
                {t('modal.minOptions')}
              </p>
            }
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 transition-colors">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">
              
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={
              !question.trim() || options.filter((o) => o.trim()).length < 2
              }
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              
              {t('modal.create')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>);

};