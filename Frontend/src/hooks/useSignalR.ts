import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addRealTimeMessage } from '../store/slices/messageSlice';
import { bumpUnread, fetchConversations } from '../store/slices/conversationSlice';
import { fetchFriends } from '../store/slices/friendSlice';
import { setTyping } from '../store/slices/uiSlice';
import { setIncomingCall, updateCallStatus, clearCall, CallType } from '../store/slices/callSlice';
import type { MessageDto } from '../types/api';

const HUB_URL = 'http://localhost:5054/hubs/chat';

// Singleton connection
let sharedConnection: signalR.HubConnection | null = null;

export function useSignalR() {
  const dispatch = useAppDispatch();
  const { accessToken, isAuthenticated } = useAppSelector((s) => s.auth);
  const activeId = useAppSelector((s) => s.conversations.activeId);
  const currentUserId = useAppSelector((s) => s.auth.user?.id ?? '');
  const conversations = useAppSelector((s) => s.conversations.items);
  const { activeCall, incomingCall } = useAppSelector((s) => s.call);

  const activeIdRef = useRef(activeId);
  const conversationsRef = useRef(conversations);
  const activeCallRef = useRef(activeCall);
  const incomingCallRef = useRef(incomingCall);

  activeIdRef.current = activeId;
  conversationsRef.current = conversations;
  activeCallRef.current = activeCall;
  incomingCallRef.current = incomingCall;

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    // Reuse existing connection if available
    if (sharedConnection && sharedConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${HUB_URL}?access_token=${accessToken}`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    sharedConnection = connection;

    // Chat events
    connection.on('ReceiveMessage', (dto: MessageDto) => {
      if (dto.senderId !== currentUserId) {
        dispatch(addRealTimeMessage({ dto, currentUserId }));
      }
      if (dto.conversationId !== activeIdRef.current) {
        dispatch(bumpUnread(dto.conversationId));
      }
      dispatch(fetchConversations());
    });

    connection.on('MessageRecalled', () => {
      dispatch(fetchConversations());
    });

    connection.on('UserOnline', () => {
      dispatch(fetchConversations());
      dispatch(fetchFriends());
    });

    connection.on('UserOffline', () => {
      dispatch(fetchConversations());
      dispatch(fetchFriends());
    });

    connection.on('UserTyping', (convId: string, _userId: string, isTyping: boolean) => {
      dispatch(setTyping({ convId, isTyping }));
      if (isTyping) {
        setTimeout(() => dispatch(setTyping({ convId, isTyping: false })), 3000);
      }
    });

    connection.on('MessagesRead', () => {
      dispatch(fetchConversations());
    });

    // Call events
    connection.on('CallInitiated', (callId: string, conversationId: string) => {
      console.log('Call initiated, received callId:', callId);
      // Dispatch event to update temp callId to real callId
      window.dispatchEvent(new CustomEvent('call-initiated', { detail: { callId, conversationId } }));
    });

    connection.on('IncomingCall', (callId: string, conversationId: string, callerId: string, callType: string, offer: string) => {
      console.log('Incoming call:', callId, conversationId, callerId, callType);

      const conv = conversationsRef.current.find((c) => c.id === conversationId);
      const caller = conv?.members?.find((m) => m.id === callerId) || conv?.user;

      dispatch(
        setIncomingCall({
          id: callId,
          conversationId,
          callerId,
          callerName: caller?.name || 'Unknown',
          callerAvatar: caller?.avatar || '',
          type: callType as CallType,
          offer,
        })
      );
    });

    connection.on('CallAnswered', (callId: string, userId: string, answer: string) => {
      console.log('Call answered:', callId, userId, 'answer SDP:', answer);
      if (activeCallRef.current?.id === callId) {
        dispatch(updateCallStatus('active'));
        // Dispatch answer SDP to useCall hook
        window.dispatchEvent(new CustomEvent('call-answered', { detail: { callId, userId, answer } }));
      }
    });

    connection.on('CallRejected', (callId: string) => {
      console.log('Call rejected:', callId);
      if (activeCallRef.current?.id === callId || incomingCallRef.current?.id === callId) {
        dispatch(clearCall());
        // Dispatch custom event for useCall hook to clean up WebRTC
        window.dispatchEvent(new CustomEvent('call-ended', { detail: { callId } }));
      }
    });

    connection.on('CallEnded', (callId: string) => {
      console.log('Call ended:', callId);
      if (activeCallRef.current?.id === callId) {
        dispatch(clearCall());
        // Dispatch custom event for useCall hook to clean up WebRTC
        window.dispatchEvent(new CustomEvent('call-ended', { detail: { callId } }));
      }
    });

    connection.on('IceCandidate', (userId: string, candidate: string) => {
      console.log('ICE candidate received from:', userId);
      // Will be handled by useCall hook via custom event
      window.dispatchEvent(new CustomEvent('ice-candidate', { detail: { userId, candidate } }));
    });

    connection.on('MediaToggled', (userId: string, mediaType: string, enabled: boolean) => {
      console.log('Media toggled:', userId, mediaType, enabled);
      window.dispatchEvent(new CustomEvent('media-toggled', { detail: { userId, mediaType, enabled } }));
    });

    connection.on('CallError', (message: string) => {
      console.error('Call error:', message);
      alert(message);
    });

    connection.start()
      .then(() => console.log('SignalR connected'))
      .catch((err) => console.error('SignalR connection error:', err));

    return () => {
      if (sharedConnection) {
        sharedConnection.stop();
        sharedConnection = null;
      }
    };
  }, [isAuthenticated, accessToken, currentUserId, dispatch]);
}

// Export connection getter for useCall hook
export function getSignalRConnection(): signalR.HubConnection | null {
  return sharedConnection;
}
