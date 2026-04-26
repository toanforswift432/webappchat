import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addRealTimeMessage, toggleMessageReaction, markRecalled, markDeleted, setPinned, markMessagesSeen } from "../store/slices/messageSlice";
import {
  bumpUnread,
  updateLastMessage,
  markLastMessageRecalled,
  markLastMessageDeleted,
  setUserStatus as setConvUserStatus,
  upsertConversation,
  updateConvAvatar,
  renameConversation,
  removeMemberFromConv,
  removeConversation,
} from "../store/slices/conversationSlice";
import { mapMessage, mapConversation } from "../types/mappers";
import { fetchFriends, fetchFriendRequests, setUserStatus as setFriendUserStatus } from "../store/slices/friendSlice";
import type { ConversationDto, MessageDto } from "../types/api";
import { setTyping, addNotification } from "../store/slices/uiSlice";
import { setIncomingCall, setActiveCall, updateCallStatus, clearCall, CallType } from "../store/slices/callSlice";
import { updateLocalUserStatus, updateStatus as updateStatusAsync } from "../store/slices/authSlice";
import { playMessageSound, playFriendRequestSound, NotificationSoundType } from "../utils/sounds";
import { HUB_URL, BASE_URL } from "../config";

// Singleton connection
let sharedConnection: signalR.HubConnection | null = null;
// Track which conversation groups the current connection has joined
let joinedGroupIds = new Set<string>();

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

      // Play sound only when the conversation is NOT currently open AND not sent by current user AND conversation is not muted
      if (dto.conversationId !== activeIdRef.current && dto.senderId !== currentUserId) {
        // Check if conversation is muted
        const conversation = conversationsRef.current.find((c) => c.id === dto.conversationId);
        const isMuted = conversation?.isMuted ?? false;

        if (!isMuted) {
          console.log("🔊 Conditions met, calling playMessageSound...");
          const soundType = (notificationSettingsRef.current?.messageSoundType || "ding") as NotificationSoundType;
          playMessageSound(notificationSettingsRef.current, soundType);
        } else {
          console.log("🔇 Conversation is muted, skipping sound");
        }
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
      dispatch(updateLastMessage({ conversationId: dto.conversationId, message: mapMessage(dto) }));
    });

    connection.on("MessageRecalled", (messageId: string, conversationId: string) => {
      dispatch(markRecalled({ messageId, conversationId }));
      dispatch(markLastMessageRecalled({ messageId, conversationId }));
    });

    connection.on("MessageDeleted", (messageId: string, conversationId: string) => {
      dispatch(markDeleted({ messageId, conversationId }));
      dispatch(markLastMessageDeleted({ messageId, conversationId }));
    });

    connection.on("MessagePinned", (messageId: string, conversationId: string) => {
      dispatch(setPinned({ messageId, conversationId, isPinned: true }));
    });

    connection.on("MessageUnpinned", (messageId: string, conversationId: string) => {
      dispatch(setPinned({ messageId, conversationId, isPinned: false }));
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

    connection.on("UserOnline", (userId: string) => {
      dispatch(setFriendUserStatus({ userId, isOnline: true, status: 1 })); // 1 = Online
      dispatch(setConvUserStatus({ userId, isOnline: true, status: 1 }));
    });

    connection.on("UserOffline", (userId: string) => {
      dispatch(setFriendUserStatus({ userId, isOnline: false, status: 0 })); // 0 = Offline
      dispatch(setConvUserStatus({ userId, isOnline: false, status: 0 }));
    });

    connection.on("UserStatusChanged", (userId: string, status: number) => {
      console.log("📡 UserStatusChanged:", userId, status);
      // Update status in both friends and conversations
      dispatch(setFriendUserStatus({ userId, isOnline: status !== 0, status }));
      dispatch(setConvUserStatus({ userId, isOnline: status !== 0, status }));

      // Also update authSlice if this is the current user
      if (userId === currentUserId && status !== undefined) {
        console.log("✅ Updating own status in authSlice:", status);
        dispatch(updateLocalUserStatus(status));
      }
    });

    connection.on("UserTyping", (convId: string, _userId: string, isTyping: boolean) => {
      dispatch(setTyping({ convId, isTyping }));
      if (isTyping) {
        setTimeout(() => dispatch(setTyping({ convId, isTyping: false })), 3000);
      }
    });

    connection.on("MessagesRead", (data: { conversationId: string; userId: string }) => {
      console.log("👁️ MessagesRead:", data);
      // Mark messages as seen - update status of messages sent by current user
      dispatch(markMessagesSeen({
        conversationId: data.conversationId,
        readByUserId: data.userId,
        currentUserId: currentUserId,
      }));
    });

    // ── Friend events ──────────────────────────────────────────────
    connection.on("FriendRequestReceived", (senderId: string, senderName: string, senderAvatar: string) => {
      const soundType = (notificationSettingsRef.current?.callSoundType || "chime") as NotificationSoundType;
      playFriendRequestSound(notificationSettingsRef.current, soundType);
      dispatch(fetchFriendRequests());

      // Add notification
      import("../store/slices/uiSlice").then((uiModule) => {
        const notificationId = `friend_req_${senderId}_${Date.now()}`;
        dispatch(uiModule.addNotification({
          id: notificationId,
          type: "friend_request",
          title: "Lời mời kết bạn",
          body: `${senderName} vừa gửi lời mời kết bạn tới bạn`,
          timestamp: new Date().toISOString(),
          isRead: false,
          relatedId: senderId,
          fromUserId: senderId,
        }));
      });
    });

    connection.on("FriendRequestAccepted", (_accepterId: string, _accepterName: string) => {
      dispatch(fetchFriends());
      dispatch(fetchFriendRequests());
    });

    connection.on("GroupCreated", (dto: ConversationDto) => {
      const conv = mapConversation(dto, currentUserId);
      dispatch(upsertConversation(conv));
    });

    connection.on("GroupAvatarUpdated", (conversationId: string, avatarUrl: string) => {
      const resolved = avatarUrl.startsWith("/") ? `${BASE_URL}${avatarUrl}` : avatarUrl;
      dispatch(updateConvAvatar({ conversationId, avatarUrl: resolved }));
    });

    connection.on("GroupRenamed", (conversationId: string, name: string) => {
      dispatch(renameConversation({ conversationId, name }));
    });

    connection.on("MemberKicked", (conversationId: string, userId: string) => {
      if (userId === currentUserId) {
        dispatch(removeConversation(conversationId));
      } else {
        dispatch(removeMemberFromConv({ conversationId, userId }));
      }
    });

    connection.on("MemberLeft", (conversationId: string, userId: string) => {
      if (userId === currentUserId) {
        dispatch(removeConversation(conversationId));
      } else {
        dispatch(removeMemberFromConv({ conversationId, userId }));
      }
    });

    connection.on("MemberAdded", (conversationId: string, userId: string) => {
      // Refresh conversation to get updated member list
      if (userId !== currentUserId) {
        dispatch(removeMemberFromConv({ conversationId, userId: "__noop__" }));
      }
    });

    // ── Block events ────────────────────────────────────────────────
    connection.on("UserBlocked", (blockerUserId: string) => {
      console.log("🚫 UserBlocked:", blockerUserId);
      // Trigger a custom event that ChatArea can listen to
      window.dispatchEvent(new CustomEvent("user-blocked", { detail: { userId: blockerUserId } }));
    });

    connection.on("UserUnblocked", (unblockerUserId: string) => {
      console.log("✅ UserUnblocked:", unblockerUserId);
      // Trigger a custom event that ChatArea can listen to
      window.dispatchEvent(new CustomEvent("user-unblocked", { detail: { userId: unblockerUserId } }));
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
      .then(async () => {
        console.log("SignalR connected");

        // Restore user status from localStorage after reconnecting
        try {
          const storedUser = localStorage.getItem("authUser");
          if (storedUser) {
            const user = JSON.parse(storedUser);
            // Restore status (default to Online if not set)
            const statusToRestore = user.status ?? 1; // Default to Online (1)
            console.log("📡 Restoring user status from localStorage:", statusToRestore);
            const { userService } = await import("../services/user.service");
            await userService.updateStatus(statusToRestore);
            console.log("✅ Status restored successfully");

            // Also update authSlice immediately
            dispatch(updateStatusAsync(statusToRestore));
          }
        } catch (err) {
          console.error("Failed to restore user status:", err);
        }

        // Join all current conversation groups immediately after connecting
        joinedGroupIds.clear();
        conversationsRef.current.forEach((conv) => {
          joinedGroupIds.add(conv.id);
          connection.invoke("JoinConversation", conv.id).catch(() => {});
        });
      })
      .catch((err) => console.error("SignalR connection error:", err));

    return () => {
      if (sharedConnection) {
        sharedConnection.stop();
        sharedConnection = null;
        joinedGroupIds.clear();
      }
    };
  }, [isAuthenticated, accessToken, currentUserId, dispatch]);

  // Join SignalR groups for any conversation not yet joined.
  // Handles new direct chats and groups added after the connection was established.
  useEffect(() => {
    if (!sharedConnection || sharedConnection.state !== signalR.HubConnectionState.Connected) return;
    const conn = sharedConnection;
    conversations.forEach((conv) => {
      if (!joinedGroupIds.has(conv.id)) {
        joinedGroupIds.add(conv.id);
        conn.invoke("JoinConversation", conv.id).catch(() => {});
      }
    });
  }, [conversations]);
}

// Export connection getter for useCall hook
export function getSignalRConnection(): signalR.HubConnection | null {
  return sharedConnection;
}
