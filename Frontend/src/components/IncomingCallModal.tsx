import React from 'react';
import { Phone, X, Video, PhoneCall } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { useCall } from '../hooks/useCall';
import { useCallAudio } from '../hooks/useCallAudio';
import { motion } from 'framer-motion';

export const IncomingCallModal: React.FC = () => {
  const { incomingCall } = useAppSelector((s) => s.call);
  const { answerCall, rejectCall } = useCall();

  // Play ringtone: audio call = classic phone ring, video call = ascending tone
  useCallAudio(!!incomingCall, incomingCall?.type === 'video' ? 'incoming-video' : 'incoming-audio');

  if (!incomingCall) return null;

  const isVideo = incomingCall.type === 'video';

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
          <div className="relative inline-flex items-center justify-center mb-6">
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className={`absolute w-28 h-28 rounded-full ${isVideo ? 'bg-blue-500' : 'bg-green-500'}`}
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: 0.3 }}
              className={`absolute w-24 h-24 rounded-full ${isVideo ? 'bg-blue-400' : 'bg-green-400'}`}
            />
            {incomingCall.callerAvatar ? (
              <img
                src={incomingCall.callerAvatar}
                alt={incomingCall.callerName}
                className="w-20 h-20 rounded-full object-cover relative z-10 ring-4 ring-white dark:ring-gray-700"
              />
            ) : (
              <div className={`w-20 h-20 rounded-full relative z-10 ring-4 ring-white dark:ring-gray-700 flex items-center justify-center text-white text-2xl font-bold ${isVideo ? 'bg-blue-500' : 'bg-green-500'}`}>
                {incomingCall.callerName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {incomingCall.callerName}
          </h2>
          <p className={`text-sm flex items-center justify-center gap-1.5 font-medium ${isVideo ? 'text-blue-500' : 'text-green-500'}`}>
            {isVideo ? (
              <><Video className="w-4 h-4" /> Cuộc gọi video</>
            ) : (
              <><PhoneCall className="w-4 h-4" /> Cuộc gọi thoại</>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-8 justify-center">
          {/* Reject */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all transform hover:scale-105"
            >
              <X className="w-7 h-7" />
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">Từ chối</span>
          </div>

          {/* Answer */}
          <div className="flex flex-col items-center gap-2">
            <motion.button
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              onClick={answerCall}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg transition-colors"
            >
              {isVideo ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
            </motion.button>
            <span className="text-xs text-gray-500 dark:text-gray-400">Trả lời</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
