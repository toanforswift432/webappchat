import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Info, CheckCircle, X } from "lucide-react";

export type ToastType = "info" | "warning" | "success" | "error";

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  warning: <AlertTriangle className="w-4 h-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />,
  error: <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />,
  info: <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />,
  success: <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />,
};

const bgClasses: Record<ToastType, string> = {
  warning: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700",
  error: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700",
  info: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700",
  success: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700",
};

const textClasses: Record<ToastType, string> = {
  warning: "text-yellow-800 dark:text-yellow-200",
  error: "text-red-800 dark:text-red-200",
  info: "text-blue-800 dark:text-blue-200",
  success: "text-green-800 dark:text-green-200",
};

const DURATION = 3500;

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm min-w-[240px] max-w-sm ${bgClasses[toast.type]}`}
    >
      {icons[toast.type]}
      <span className={`text-sm font-medium flex-1 ${textClasses[toast.type]}`}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
    <AnimatePresence mode="popLayout">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </AnimatePresence>
  </div>
);
