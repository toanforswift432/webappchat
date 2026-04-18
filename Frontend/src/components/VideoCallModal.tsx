import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { useCall } from '../hooks/useCall';
import { useCallAudio } from '../hooks/useCallAudio';
import { getWebRTCService } from '../services/webrtc.service';

export const VideoCallModal: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const { activeCall, isVideoEnabled, isAudioEnabled } = useAppSelector((s) => s.call);
  const conversations = useAppSelector((s) => s.conversations.items);

  useCallAudio(
    activeCall?.status === 'connecting' && activeCall?.isInitiator === true,
    'ringback'
  );

  const applyLocalStream = useCallback((stream: MediaStream) => {
    setLocalStream(stream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, []);

  const applyRemoteStream = useCallback((stream: MediaStream) => {
    setRemoteStream(stream);
    setHasRemoteStream(true);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, []);

  // Stable callback refs for useCall hook
  const onLocalStreamRef = useRef((stream: MediaStream) => applyLocalStream(stream));
  const onRemoteStreamRef = useRef((stream: MediaStream) => applyRemoteStream(stream));

  const { endCall, toggleVideo, toggleAudio } = useCall({
    onLocalStream: onLocalStreamRef.current,
    onRemoteStream: onRemoteStreamRef.current,
  });

  // Listen to DOM events dispatched directly by WebRTCService when tracks arrive.
  // This is the most reliable path — bypasses all React callback timing issues.
  useEffect(() => {
    const onRemote = (e: Event) => applyRemoteStream((e as CustomEvent).detail);
    const onLocal = (e: Event) => applyLocalStream((e as CustomEvent).detail);
    window.addEventListener('webrtc-remote-stream', onRemote);
    window.addEventListener('webrtc-local-stream', onLocal);
    return () => {
      window.removeEventListener('webrtc-remote-stream', onRemote);
      window.removeEventListener('webrtc-local-stream', onLocal);
    };
  }, [applyLocalStream, applyRemoteStream]);

  // Polling fallback: every 500ms check the WebRTC service directly and apply
  // any streams that haven't been applied to the video elements yet.
  // Stops after 15 seconds (30 attempts) — well past any timing scenario.
  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(() => {
      const svc = getWebRTCService();

      const local = svc.getLocalStream();
      if (local && localVideoRef.current && localVideoRef.current.srcObject !== local) {
        localVideoRef.current.srcObject = local;
        setLocalStream(local);
      }

      const remote = svc.getRemoteStream();
      if (remote && remoteVideoRef.current && remoteVideoRef.current.srcObject !== remote) {
        remoteVideoRef.current.srcObject = remote;
        remoteVideoRef.current.play().catch(() => {});
        setRemoteStream(remote);
        setHasRemoteStream(true);
      }

      if (++attempts >= 30) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  // Re-run when a new call starts so the new service instance is polled
  }, [activeCall?.id, applyLocalStream, applyRemoteStream]);

  // Apply local stream whenever it changes (e.g. call type switch)
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall?.type]);

  // Apply remote stream whenever it changes
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration timer
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
      <div className="relative flex-1 bg-gray-800">

        {/* Remote video — always in DOM so ref is never null */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${hasRemoteStream ? '' : 'hidden'}`}
        />

        {/* Avatar overlay shown while waiting for remote stream */}
        {!hasRemoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-indigo-500 flex items-center justify-center mb-4 text-white text-4xl font-bold">
              {otherParticipant?.name?.slice(0, 2).toUpperCase() || 'AN'}
            </div>
            <h2 className="text-white text-2xl font-semibold mb-2">
              {otherParticipant?.name || 'Unknown'}
            </h2>
            <p className="text-gray-400">
              {activeCall.status === 'connecting' ? 'Connecting...' : 'Ringing...'}
            </p>
          </div>
        )}

        {/* Local video PiP — only for video calls */}
        {activeCall.type === 'video' && (
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoEnabled ? '' : 'hidden'}`}
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>
        )}

        {/* Call info top-left */}
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
          <button
            onClick={() => toggleAudio(!isAudioEnabled)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {activeCall.type === 'video' && (
            <button
              onClick={() => toggleVideo(!isVideoEnabled)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
          )}

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
