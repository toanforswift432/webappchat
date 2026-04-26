import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { conversationService } from "../../services/conversation.service";
import { mapConversation } from "../../types/mappers";
import type { Conversation, Message } from "../../types";
import type { RootState } from "../index";

interface ConversationState {
  items: Conversation[];
  activeId: string | null;
  status: "idle" | "loading" | "failed";
}

const initial: ConversationState = {
  items: [],
  activeId: null,
  status: "idle",
};

export const fetchConversations = createAsyncThunk(
  "conversations/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const currentUserId = state.auth.user?.id ?? "";
      const dtos = await conversationService.getAll();
      return dtos.map((dto) => mapConversation(dto, currentUserId));
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Failed to load conversations");
    }
  },
);

export const getOrCreateDirect = createAsyncThunk(
  "conversations/getOrCreateDirect",
  async (otherUserId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const currentUserId = state.auth.user?.id ?? "";
      const dto = await conversationService.getOrCreateDirect(otherUserId);
      return mapConversation(dto, currentUserId);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Failed");
    }
  },
);

export const createGroup = createAsyncThunk(
  "conversations/createGroup",
  async ({ name, memberIds }: { name: string; memberIds: string[] }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const currentUserId = state.auth.user?.id ?? "";
      const dto = await conversationService.createGroup(name, memberIds);
      return mapConversation(dto, currentUserId);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Failed to create group");
    }
  },
);

const conversationSlice = createSlice({
  name: "conversations",
  initialState: initial,
  reducers: {
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeId = action.payload;
      if (action.payload) {
        const conv = state.items.find((c) => c.id === action.payload);
        if (conv) conv.unreadCount = 0;
      }
    },
    upsertConversation(state, action: PayloadAction<Conversation>) {
      const idx = state.items.findIndex((c) => c.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
      else state.items.unshift(action.payload);
    },
    removeConversation(state, action: PayloadAction<string>) {
      state.items = state.items.filter((c) => c.id !== action.payload);
      if (state.activeId === action.payload) state.activeId = null;
    },
    bumpUnread(state, action: PayloadAction<string>) {
      const conv = state.items.find((c) => c.id === action.payload);
      if (conv && conv.id !== state.activeId) conv.unreadCount += 1;
    },
    updateConvAvatar(state, action: PayloadAction<{ conversationId: string; avatarUrl: string }>) {
      const conv = state.items.find((c) => c.id === action.payload.conversationId);
      if (conv) conv.groupAvatar = action.payload.avatarUrl;
    },
    renameConversation(state, action: PayloadAction<{ conversationId: string; name: string }>) {
      const conv = state.items.find((c) => c.id === action.payload.conversationId);
      if (conv) {
        conv.groupName = action.payload.name;
        conv.user.name = action.payload.name;
      }
    },
    removeMemberFromConv(state, action: PayloadAction<{ conversationId: string; userId: string }>) {
      const conv = state.items.find((c) => c.id === action.payload.conversationId);
      if (conv?.members) conv.members = conv.members.filter((m) => m.id !== action.payload.userId);
    },
    setUserStatus(state, action: PayloadAction<{ userId: string; isOnline: boolean; status?: number }>) {
      state.items.forEach((conv) => {
        if (conv.user?.id === action.payload.userId) {
          conv.user.isOnline = action.payload.isOnline;
          if (action.payload.status !== undefined) {
            conv.user.status = action.payload.status;
          }
        }
        conv.members?.forEach((m) => {
          if (m.id === action.payload.userId) {
            m.isOnline = action.payload.isOnline;
            if (action.payload.status !== undefined) {
              m.status = action.payload.status;
            }
          }
        });
      });
    },
    updateLastMessage(state, action: PayloadAction<{ conversationId: string; message: Message }>) {
      const idx = state.items.findIndex((c) => c.id === action.payload.conversationId);
      if (idx >= 0) {
        state.items[idx] = { ...state.items[idx], lastMessage: action.payload.message };
        // Move to top so the list stays sorted by most recent
        if (idx > 0) {
          const [conv] = state.items.splice(idx, 1);
          state.items.unshift(conv);
        }
      }
    },
    markLastMessageRecalled(state, action: PayloadAction<{ messageId: string; conversationId: string }>) {
      const conv = state.items.find((c) => c.id === action.payload.conversationId);
      if (conv?.lastMessage?.id === action.payload.messageId) {
        conv.lastMessage = { ...conv.lastMessage, isRecalled: true, content: "" };
      }
    },
    markLastMessageDeleted(state, action: PayloadAction<{ messageId: string; conversationId: string }>) {
      const conv = state.items.find((c) => c.id === action.payload.conversationId);
      if (conv?.lastMessage?.id === action.payload.messageId) {
        conv.lastMessage = undefined;
      }
    },
    updateConversationMute(state, action: PayloadAction<{ conversationId: string; isMuted: boolean }>) {
      const conv = state.items.find((c) => c.id === action.payload.conversationId);
      if (conv) {
        conv.isMuted = action.payload.isMuted;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = "idle";
        state.items = action.payload;
      })
      .addCase(fetchConversations.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(getOrCreateDirect.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
        else state.items.unshift(action.payload);
        state.activeId = action.payload.id;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.activeId = action.payload.id;
      });
  },
});

export const {
  setActiveConversation,
  upsertConversation,
  removeConversation,
  bumpUnread,
  updateLastMessage,
  markLastMessageRecalled,
  markLastMessageDeleted,
  setUserStatus,
  updateConvAvatar,
  renameConversation,
  removeMemberFromConv,
  updateConversationMute,
} = conversationSlice.actions;
export default conversationSlice.reducer;
