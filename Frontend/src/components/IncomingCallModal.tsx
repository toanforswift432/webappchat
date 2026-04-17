import React from 'react';
import { Phone, X, Video, PhoneCall } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { useCall } from '../hooks/useCall';
import { motion } from 'framer-motion';

export const IncomingCallModal: React.FC = () => {
  const { incomingCall } = useAppSelector((s) => s.call);
  const { answerCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4"
      >
        {/* Caller Info */}
        <div className="text-center mb-8">
          {/* Avatar with pulse animation */}
          <div className="relative inline-block mb-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-24 h-24 rounded-full bg-blue-500 absolute inset-0 opacity-25"
            />
            <img
              src={incomingCall.callerAvatar}
              alt={incomingCall.callerName}
              className="w-24 h-24 rounded-full object-cover relative z-10 ring-4 ring-white dark:ring-gray-700"
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {incomingCall.callerName}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
            {incomingCall.type === 'video' ? (
              <>
                <Video className="w-5 h-5" />
                Video call incoming...
              </>
            ) : (
              <>
                <PhoneCall className="w-5 h-5" />
                Voice call incoming...
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {/* Reject Button */}
          <button
            onClick={rejectCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all transform hover:scale-105"
            title="Reject"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Answer Button */}
          <button
            onClick={answerCall}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg transition-all transform hover:scale-105"
            title="Answer"
          >
            <Phone className="w-8 h-8" />
          </button>
        </div>

        {/* Additional Info */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Answering will share your camera and microphone
        </p>
      </motion.div>
    </div>
  );
};
