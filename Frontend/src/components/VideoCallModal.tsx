import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { useCall } from '../hooks/useCall';

export const VideoCallModal: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const { activeCall, isVideoEnabled, isAudioEnabled } = useAppSelector((s) => s.call);
  const conversations = useAppSelector((s) => s.conversations.items);

  const { endCall, toggleVideo, toggleAudio } = useCall({
    onLocalStream: (stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    },
    onRemoteStream: (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        setHasRemoteStream(true);
      }
    },
  });

  // Update call duration
  useEffect(() => {
    if (activeCall?.status === 'active' && activeCall.startTime) {
      const interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - activeCall.startTime!) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeCall?.status, activeCall?.startTime]);

  if (!activeCall) return null;

  const conversation = conversations.find((c) => c.id === activeCall.conversationId);
  const otherParticipant = conversation?.user;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Remote video - full screen */}
      <div className="relative flex-1 bg-gray-800">
        {hasRemoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4">
              <img
                src={otherParticipant?.avatar}
                alt={otherParticipant?.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <h2 className="text-white text-2xl font-semibold mb-2">
              {otherParticipant?.name || 'Unknown'}
            </h2>
            <p className="text-gray-400">
              {activeCall.status === 'connecting' ? 'Connecting...' : 'Ringing...'}
            </p>
          </div>
        )}

        {/* Local video - picture-in-picture */}
        {activeCall.type === 'video' && (
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden shadow-lg">
            {isVideoEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <VideoOff className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>
        )}

        {/* Call info */}
        <div className="absolute top-4 left-4 text-white">
          <h3 className="text-lg font-semibold">{otherParticipant?.name || 'Unknown'}</h3>
          {activeCall.status === 'active' && (
            <p className="text-sm text-gray-300">{formatDuration(callDuration)}</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 py-6 px-4">
        <div className="flex items-center justify-center gap-4">
          {/* Toggle Audio */}
          <button
            onClick={() => toggleAudio(!isAudioEnabled)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {/* Toggle Video */}
          {activeCall.type === 'video' && (
            <button
              onClick={() => toggleVideo(!isVideoEnabled)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isVideoEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
            title="End call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
