import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addRealTimeMessage, toggleMessageReaction, markRecalled } from "../store/slices/messageSlice";
import { bumpUnread, fetchConversations } from "../store/slices/conversationSlice";
import { fetchFriends, fetchFriendRequests } from "../store/slices/friendSlice";
import { setTyping } from "../store/slices/uiSlice";
import { setIncomingCall, setActiveCall, updateCallStatus, clearCall, CallType } from "../store/slices/callSlice";
import { playMessageSound, playFriendRequestSound, NotificationSoundType } from "../utils/sounds";
import type { MessageDto } from "../types/api";
import { HUB_URL } from "../config";

// Singleton connection
let sharedConnection: signalR.HubConnection | null = null;

export function useSignalR() {
  const dispatch = useAppDispatch();
  const { accessToken, isAuthenticated } = useAppSelector((s) => s.auth);
  const activeId = useAppSelector((s) => s.conversations.activeId);
  const currentUserId = useAppSelector((s) => s.auth.user?.id ?? "");
  const notificationSettings = useAppSelector((s) => s.auth.user?.notificationSettings);
  const conversations = useAppSelector((s) => s.conversations.items);
  const { activeCall, incomingCall } = useAppSelector((s) => s.call);

  const activeIdRef = useRef(activeId);
  const conversationsRef = useRef(conversations);
  const activeCallRef = useRef(activeCall);
  const incomingCallRef = useRef(incomingCall);
  const notificationSettingsRef = useRef(notificationSettings);

  activeIdRef.current = activeId;
  conversationsRef.current = conversations;
  activeCallRef.current = activeCall;
  incomingCallRef.current = incomingCall;
  notificationSettingsRef.current = notificationSettings;

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

    // ── Chat events ────────────────────────────────────────────────
    connection.on("ReceiveMessage", (dto: MessageDto) => {
      console.log("📨 ReceiveMessage event:", {
        conversationId: dto.conversationId,
        senderId: dto.senderId,
        currentUserId,
        activeId: activeIdRef.current,
        notificationSettings: notificationSettingsRef.current,
      });

      dispatch(addRealTimeMessage({ dto, currentUserId }));

      // Play sound only when the conversation is NOT currently open AND not sent by current user
      if (dto.conversationId !== activeIdRef.current && dto.senderId !== currentUserId) {
        console.log("🔊 Conditions met, calling playMessageSound...");
        const soundType = (notificationSettingsRef.current?.messageSoundType || "ding") as NotificationSoundType;
        playMessageSound(notificationSettingsRef.current, soundType);
        dispatch(bumpUnread(dto.conversationId));
      } else {
        console.log("🚫 Not playing sound:", {
          conversationOpen: dto.conversationId === activeIdRef.current,
          fromCurrentUser: dto.senderId === currentUserId,
        });

        if (dto.conversationId === activeIdRef.current) {
          // Conversation is open — auto mark read
          connection.invoke("MarkRead", dto.conversationId).catch(() => {});
        }
      }
      dispatch(fetchConversations());
    });

    connection.on("MessageRecalled", (messageId: string, conversationId: string) => {
      dispatch(markRecalled({ messageId, conversationId }));
      dispatch(fetchConversations());
    });

    connection.on(
      "ReactionToggled",
      (data: { conversationId: string; messageId: string; userId: string; emoji: string; added: boolean }) => {
        dispatch(
          toggleMessageReaction({
            conversationId: data.conversationId,
            messageId: data.messageId,
            userId: data.userId,
            emoji: data.emoji,
            added: data.added,
          }),
        );
      },
    );

    connection.on("UserOnline", () => {
      dispatch(fetchConversations());
      dispatch(fetchFriends());
    });

    connection.on("UserOffline", () => {
      dispatch(fetchConversations());
      dispatch(fetchFriends());
    });

    connection.on("UserTyping", (convId: string, _userId: string, isTyping: boolean) => {
      dispatch(setTyping({ convId, isTyping }));
      if (isTyping) {
        setTimeout(() => dispatch(setTyping({ convId, isTyping: false })), 3000);
      }
    });

    connection.on("MessagesRead", () => {
      dispatch(fetchConversations());
    });

    // ── Friend events ──────────────────────────────────────────────
    connection.on("FriendRequestReceived", (_senderId: string, _senderName: string, _senderAvatar: string) => {
      const soundType = (notificationSettingsRef.current?.callSoundType || "chime") as NotificationSoundType;
      playFriendRequestSound(notificationSettingsRef.current, soundType);
      dispatch(fetchFriendRequests());
    });

    connection.on("FriendRequestAccepted", (_accepterId: string, _accepterName: string) => {
      // Refresh friends list and requests
      dispatch(fetchFriends());
      dispatch(fetchFriendRequests());
    });

    // ── Call events ────────────────────────────────────────────────
    connection.on("CallInitiated", (callId: string, conversationId: string) => {
      console.log("Call initiated, received callId:", callId);
      window.dispatchEvent(new CustomEvent("call-initiated", { detail: { callId, conversationId } }));
    });

    connection.on(
      "IncomingCall",
      (callId: string, conversationId: string, callerId: string, callType: string, offer: string) => {
        console.log("Incoming call:", callId, conversationId, callerId, callType);

        const conv = conversationsRef.current.find((c) => c.id === conversationId);
        const caller = conv?.members?.find((m) => m.id === callerId) || conv?.user;

        dispatch(
          setIncomingCall({
            id: callId,
            conversationId,
            callerId,
            callerName: caller?.name || "Unknown",
            callerAvatar: caller?.avatar || "",
            type: callType as CallType,
            offer,
          }),
        );
      },
    );

    connection.on("CallAnswered", (callId: string, userId: string, answer: string) => {
      console.log("Call answered:", callId, userId);
      const currentCall = activeCallRef.current;
      if (currentCall && (currentCall.id === callId || currentCall.id.startsWith("temp-"))) {
        if (currentCall.id !== callId) {
          dispatch(setActiveCall({ ...currentCall, id: callId, status: "active", startTime: Date.now() }));
        } else {
          dispatch(updateCallStatus("active"));
        }
        window.dispatchEvent(new CustomEvent("call-answered", { detail: { callId, userId, answer } }));
      }
    });

    connection.on("CallRejected", (callId: string) => {
      console.log("Call rejected:", callId);
      if (activeCallRef.current?.id === callId || incomingCallRef.current?.id === callId) {
        dispatch(clearCall());
        window.dispatchEvent(new CustomEvent("call-ended", { detail: { callId } }));
      }
    });

    connection.on("CallEnded", (callId: string) => {
      console.log("Call ended:", callId);
      const isMyActiveCall = activeCallRef.current?.id === callId;
      const isMyIncomingCall = incomingCallRef.current?.id === callId;
      if (isMyActiveCall || isMyIncomingCall) {
        dispatch(clearCall());
        window.dispatchEvent(new CustomEvent("call-ended", { detail: { callId } }));
      }
    });

    connection.on("IceCandidate", (userId: string, candidate: string) => {
      window.dispatchEvent(new CustomEvent("ice-candidate", { detail: { userId, candidate } }));
    });

    connection.on("MediaToggled", (userId: string, mediaType: string, enabled: boolean) => {
      window.dispatchEvent(new CustomEvent("media-toggled", { detail: { userId, mediaType, enabled } }));
    });

    connection.on("CallError", (message: string) => {
      console.error("Call error:", message);
      alert(message);
    });

    connection
      .start()
      .then(() => console.log("SignalR connected"))
      .catch((err) => console.error("SignalR connection error:", err));

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
