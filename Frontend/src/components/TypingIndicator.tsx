import React, { Children } from 'react';
import { motion } from 'framer-motion';
export const TypingIndicator: React.FC = () => {
  const dotVariants = {
    initial: {
      y: 0
    },
    animate: {
      y: -5
    }
  };
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  return (
    <div className="flex w-full mb-4 justify-start">
      <div className="bg-white dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-600 flex items-center space-x-1 transition-colors duration-200">
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="flex space-x-1">
          
          {[0, 1, 2].map((i) =>
          <motion.span
            key={i}
            variants={dotVariants}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut'
            }}
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full block" />

          )}
        </motion.div>
      </div>
    </div>);

};