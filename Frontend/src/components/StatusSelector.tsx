import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "../i18n/LanguageContext";
export const STATUS_COLORS: Record<string, string> = {
  Available: "bg-green-500",
  Away: "bg-yellow-500",
  "In a meeting": "bg-purple-500",
  WFH: "bg-blue-500",
};
interface StatusSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (status: string) => void;
}
export const StatusSelector: React.FC<StatusSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const { t } = useTranslation();
  const statuses = [
    {
      label: t("status.available"),
      color: "bg-green-500",
      value: "Available",
    },
    {
      label: t("status.away"),
      color: "bg-yellow-500",
      value: "Away",
    },
    {
      label: t("status.inMeeting"),
      color: "bg-purple-500",
      value: "In a meeting",
    },
    {
      label: t("status.wfh"),
      color: "bg-blue-500",
      value: "WFH",
    },
  ];

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{
          opacity: 0,
          y: -10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: -10,
        }}
        className="absolute top-full mt-2 left-0 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 transition-colors duration-200"
      >
        {statuses.map(({ label, color, value }) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 transition-colors"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
            {label}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
