import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setActiveCall,
  clearCall,
  setVideoEnabled,
  setAudioEnabled,
  CallType,
} from '../store/slices/callSlice';
import { WebRTCService } from '../services/webrtc.service';
import { getSignalRConnection } from './useSignalR';

interface UseCallOptions {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
}

export function useCall(options?: UseCallOptions) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { activeCall, incomingCall } = useAppSelector((s) => s.call);

  const webrtcService = useRef(new WebRTCService());

  // Listen for call events via custom events from useSignalR
  useEffect(() => {
    const handleCallInitiated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { callId } = customEvent.detail;

      console.log('Call initiated event received, updating callId to:', callId);
      // Update the temp callId to real callId
      if (activeCall && activeCall.id.startsWith('temp-')) {
        dispatch(
          setActiveCall({
            ...activeCall,
            id: callId,
          })
        );
      }
    };

    const handleIceCandidate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { candidate } = customEvent.detail;

      try {
        const candidateObj = JSON.parse(candidate);
        await webrtcService.current.addIceCandidate(candidateObj);
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
        await webrtcService.current.setRemoteDescription(answerSdp);
        console.log('Remote description (answer) set successfully');
      } catch (error) {
        console.error('Error setting remote description (answer):', error);
      }
    };

    const handleMediaToggled = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { mediaType, enabled } = customEvent.detail;
      console.log('Remote media toggled:', mediaType, enabled);
    };

    const handleCallEnded = (event: Event) => {
      console.log('Call ended event received, cleaning up');
      dispatch(clearCall());
      webrtcService.current.cleanup();
    };

    window.addEventListener('call-initiated', handleCallInitiated);
    window.addEventListener('ice-candidate', handleIceCandidate);
    window.addEventListener('call-answered', handleCallAnswered);
    window.addEventListener('media-toggled', handleMediaToggled);
    window.addEventListener('call-ended', handleCallEnded);

    return () => {
      window.removeEventListener('call-initiated', handleCallInitiated);
      window.removeEventListener('ice-candidate', handleIceCandidate);
      window.removeEventListener('call-answered', handleCallAnswered);
      window.removeEventListener('media-toggled', handleMediaToggled);
      window.removeEventListener('call-ended', handleCallEnded);
    };
  }, [activeCall, dispatch]);

  const initiateCall = useCallback(
    async (conversationId: string, type: CallType) => {
      try {
        console.log('Initiating call:', conversationId, type);
        const hubConnection = getSignalRConnection();
        if (!hubConnection) {
          alert('Not connected to server. Please refresh the page.');
          return;
        }

        // Get local stream
        const stream = await webrtcService.current.initializeLocalStream(type === 'video');
        options?.onLocalStream?.(stream);

        // Create peer connection
        webrtcService.current.createPeerConnection(
          (remoteStream) => {
            console.log('Remote stream received');
            options?.onRemoteStream?.(remoteStream);
          },
          (candidate) => {
            // Send ICE candidate to server
            hubConnection?.invoke('SendIceCandidate', conversationId, JSON.stringify(candidate));
          }
        );

        // Create offer
        const offer = await webrtcService.current.createOffer();

        // Send offer to server
        await hubConnection.invoke('InitiateCall', conversationId, type, JSON.stringify(offer));

        // Set active call in state (ID will be updated when we get CallInitiated event)
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

      // Get local stream
      const stream = await webrtcService.current.initializeLocalStream(incomingCall.type === 'video');
      options?.onLocalStream?.(stream);

      // Create peer connection
      webrtcService.current.createPeerConnection(
        (remoteStream) => {
          console.log('Remote stream received');
          options?.onRemoteStream?.(remoteStream);
        },
        (candidate) => {
          // Send ICE candidate to server
          hubConnection?.invoke('SendIceCandidate', incomingCall.conversationId, JSON.stringify(candidate));
        }
      );

      // Set remote description (offer)
      const offerSdp = JSON.parse(incomingCall.offer);
      await webrtcService.current.setRemoteDescription(offerSdp);

      // Create answer
      const answer = await webrtcService.current.createAnswer();

      // Send answer to server
      await hubConnection.invoke('AnswerCall', incomingCall.id, incomingCall.conversationId, JSON.stringify(answer));

      // Set active call in state
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
  }, [incomingCall, dispatch, options, user?.id]);

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
    webrtcService.current.cleanup();
  }, [activeCall, dispatch]);

  const toggleVideo = useCallback(
    (enabled: boolean) => {
      webrtcService.current.toggleVideo(enabled);
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
      webrtcService.current.toggleAudio(enabled);
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
