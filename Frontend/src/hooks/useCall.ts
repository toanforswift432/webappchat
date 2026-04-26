import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setActiveCall,
  clearCall,
  setVideoEnabled,
  setAudioEnabled,
  CallType,
} from '../store/slices/callSlice';
import { getWebRTCService, resetWebRTCService } from '../services/webrtc.service';
import { getSignalRConnection } from './useSignalR';

interface UseCallOptions {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
}

export function useCall(options?: UseCallOptions) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { activeCall, incomingCall } = useAppSelector((s) => s.call);

  const activeCallRef = useRef(activeCall);
  activeCallRef.current = activeCall;

  // Register stream callbacks on the singleton whenever options change.
  // This ensures VideoCallModal's video refs get streams even when modal
  // mounts after streams are already established.
  useEffect(() => {
    if (options?.onRemoteStream || options?.onLocalStream) {
      getWebRTCService().updateStreamCallbacks(
        options.onRemoteStream ?? (() => {}),
        options.onLocalStream
      );
    }
  }, [options?.onLocalStream, options?.onRemoteStream]);

  // Listen for call events via custom events from useSignalR
  useEffect(() => {
    const handleCallInitiated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { callId } = customEvent.detail;

      console.log('Call initiated event received, updating callId to:', callId);
      const current = activeCallRef.current;
      if (current && current.id.startsWith('temp-')) {
        dispatch(setActiveCall({ ...current, id: callId }));
      }
    };

    const handleIceCandidate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { candidate } = customEvent.detail;
      try {
        const candidateObj = JSON.parse(candidate);
        await getWebRTCService().addIceCandidate(candidateObj);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    };

    const handleCallAnswered = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { answer } = customEvent.detail;
      console.log('Received call answered event, setting remote description');
      try {
        const answerSdp = JSON.parse(answer);
        await getWebRTCService().setRemoteDescription(answerSdp);
        console.log('Remote description (answer) set successfully');
      } catch (error) {
        console.error('Error setting remote description (answer):', error);
      }
    };

    const handleCallEnded = () => {
      console.log('Call ended event received, cleaning up');
      // Delay slightly so all state updates settle before cleanup
      setTimeout(() => {
        dispatch(clearCall());
        resetWebRTCService();
      }, 100);
    };

    window.addEventListener('call-initiated', handleCallInitiated);
    window.addEventListener('ice-candidate', handleIceCandidate);
    window.addEventListener('call-answered', handleCallAnswered);
    window.addEventListener('call-ended', handleCallEnded);

    return () => {
      window.removeEventListener('call-initiated', handleCallInitiated);
      window.removeEventListener('ice-candidate', handleIceCandidate);
      window.removeEventListener('call-answered', handleCallAnswered);
      window.removeEventListener('call-ended', handleCallEnded);
    };
  }, [dispatch]);

  const initiateCall = useCallback(
    async (conversationId: string, type: CallType) => {
      try {
        console.log('Initiating call:', conversationId, type);
        const hubConnection = getSignalRConnection();
        if (!hubConnection) {
          alert('Not connected to server. Please refresh the page.');
          return;
        }

        // Always reset before starting a new call to ensure clean state
        resetWebRTCService();
        const service = getWebRTCService();

        // Get local stream
        const stream = await service.initializeLocalStream(type === 'video');
        options?.onLocalStream?.(stream);

        // Create peer connection with ICE candidate handler (fetches TURN credentials)
        await service.createPeerConnection((candidate) => {
          hubConnection.invoke('SendIceCandidate', conversationId, JSON.stringify(candidate));
        });

        // Create offer
        const offer = await service.createOffer();

        // Send offer to server
        await hubConnection.invoke('InitiateCall', conversationId, type, JSON.stringify(offer));

        const tempCallId = `temp-${Date.now()}`;
        dispatch(
          setActiveCall({
            id: tempCallId,
            conversationId,
            type,
            status: 'connecting',
            isInitiator: true,
            participants: [user?.id || ''],
          })
        );
      } catch (error) {
        console.error('Error initiating call:', error);
        alert('Failed to start call. Please check your camera/microphone permissions.');
      }
    },
    [dispatch, options, user?.id]
  );

  const answerCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      console.log('Answering call:', incomingCall.id);
      const hubConnection = getSignalRConnection();
      if (!hubConnection) {
        alert('Not connected to server. Please refresh the page.');
        return;
      }

      // Always reset before answering to ensure clean WebRTC state
      resetWebRTCService();
      const service = getWebRTCService();

      // Get local stream
      await service.initializeLocalStream(incomingCall.type === 'video');

      // Create peer connection (fetches TURN credentials)
      await service.createPeerConnection((candidate) => {
        hubConnection.invoke('SendIceCandidate', incomingCall.conversationId, JSON.stringify(candidate));
      });

      // Set remote description (offer from caller)
      const offerSdp = JSON.parse(incomingCall.offer);
      await service.setRemoteDescription(offerSdp);

      // Create answer
      const answer = await service.createAnswer();

      // Send answer to server
      await hubConnection.invoke('AnswerCall', incomingCall.id, incomingCall.conversationId, JSON.stringify(answer));

      dispatch(
        setActiveCall({
          id: incomingCall.id,
          conversationId: incomingCall.conversationId,
          type: incomingCall.type,
          status: 'active',
          isInitiator: false,
          participants: [user?.id || '', incomingCall.callerId],
          startTime: Date.now(),
        })
      );
    } catch (error) {
      console.error('Error answering call:', error);
      alert('Failed to answer call. Please check your camera/microphone permissions.');
    }
  }, [incomingCall, dispatch, user?.id]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    console.log('Rejecting call:', incomingCall.id);
    const hubConnection = getSignalRConnection();
    hubConnection?.invoke('RejectCall', incomingCall.id, incomingCall.conversationId);
    dispatch(clearCall());
  }, [incomingCall, dispatch]);

  const endCall = useCallback(() => {
    if (!activeCall) return;
    console.log('Ending call:', activeCall.id);
    const hubConnection = getSignalRConnection();
    hubConnection?.invoke('EndCall', activeCall.id, activeCall.conversationId);
    dispatch(clearCall());
    resetWebRTCService();
  }, [activeCall, dispatch]);

  const toggleVideo = useCallback(
    (enabled: boolean) => {
      getWebRTCService().toggleVideo(enabled);
      dispatch(setVideoEnabled(enabled));
      if (activeCall) {
        const hubConnection = getSignalRConnection();
        hubConnection?.invoke('ToggleMedia', activeCall.conversationId, activeCall.id, 'video', enabled);
      }
    },
    [activeCall, dispatch]
  );

  const toggleAudio = useCallback(
    (enabled: boolean) => {
      getWebRTCService().toggleAudio(enabled);
      dispatch(setAudioEnabled(enabled));
      if (activeCall) {
        const hubConnection = getSignalRConnection();
        hubConnection?.invoke('ToggleMedia', activeCall.conversationId, activeCall.id, 'audio', enabled);
      }
    },
    [activeCall, dispatch]
  );

  return {
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
  };
}
