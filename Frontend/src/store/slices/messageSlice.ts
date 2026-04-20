import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { conversationService } from "../../services/conversation.service";
import { mapMessage } from "../../types/mappers";
import { updateLastMessage } from "./conversationSlice";
import type { Message } from "../../types";
import type { MessageDto } from "../../types/api";
import { MessageType } from "../../types/api";
import type { RootState } from "../index";

const PAGE_SIZE = 10;

interface MessageState {
  byConvId: Record<string, Message[]>;
  loadingConvIds: string[];
  loadingMoreConvIds: string[];
  hasMoreByConvId: Record<string, boolean>;
  pageByConvId: Record<string, number>;
  hiddenIds: string[];
}

const initial: MessageState = {
  byConvId: {},
  loadingConvIds: [],
  loadingMoreConvIds: [],
  hasMoreByConvId: {},
  pageByConvId: {},
  hiddenIds: [],
};

export const fetchMessages = createAsyncThunk("messages/fetch", async (conversationId: string, { rejectWithValue }) => {
  try {
    const dtos = await conversationService.getMessages(conversationId, 1, PAGE_SIZE);
    return { conversationId, messages: dtos.map(mapMessage), hasMore: dtos.length === PAGE_SIZE };
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error ?? "Failed to load messages");
  }
});

export const fetchMoreMessages = createAsyncThunk(
  "messages/fetchMore",
  async (conversationId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const nextPage = (state.messages.pageByConvId[conversationId] ?? 1) + 1;
      const dtos = await conversationService.getMessages(conversationId, nextPage, PAGE_SIZE);
      return {
        conversationId,
        messages: dtos.map(mapMessage),
        page: nextPage,
        hasMore: dtos.length === PAGE_SIZE,
      };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Failed to load more messages");
    }
  },
);

export const sendMessage = createAsyncThunk(
  "messages/send",
  async (
    payload: {
      conversationId: string;
      type: MessageType;
      content: string | null;
      options?: { fileUrl?: string; fileName?: string; fileSize?: number; replyToMessageId?: string };
    },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const dto = await conversationService.sendMessage(
        payload.conversationId,
        payload.type,
        payload.content,
        payload.options,
      );
      const msg = mapMessage(dto);

      // Update lastMessage in-place — no extra API call needed
      dispatch(updateLastMessage({ conversationId: payload.conversationId, message: msg }));

      return { conversationId: payload.conversationId, message: msg };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Failed to send message");
    }
  },
);

export const recallMessage = createAsyncThunk(
  "messages/recall",
  async ({ conversationId, messageId }: { conversationId: string; messageId: string }, { rejectWithValue }) => {
    try {
      await conversationService.recallMessage(conversationId, messageId);
      return { conversationId, messageId };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Failed to recall message");
    }
  },
);

const messageSlice = createSlice({
  name: "messages",
  initialState: initial,
  reducers: {
    addRealTimeMessage(state, action: PayloadAction<{ dto: MessageDto; currentUserId: string }>) {
      const msg = mapMessage(action.payload.dto);
      const list = state.byConvId[msg.conversationId];
      if (list) {
        const exists = list.some((m) => m.id === msg.id);
        if (!exists) list.push(msg);
      }
    },
    replaceTempMessage(state, action: PayloadAction<{ conversationId: string; tempId: string; message: Message }>) {
      const list = state.byConvId[action.payload.conversationId];
      if (list) {
        const idx = list.findIndex((m) => m.id === action.payload.tempId);
        if (idx >= 0) list[idx] = action.payload.message;
      }
    },
    clearMessages(state, action: PayloadAction<string>) {
      delete state.byConvId[action.payload];
    },
    hideMessage(state, action: PayloadAction<string>) {
      if (!state.hiddenIds.includes(action.payload)) {
        state.hiddenIds.push(action.payload);
      }
    },
    markRecalled(state, action: PayloadAction<{ messageId: string; conversationId: string }>) {
      const list = state.byConvId[action.payload.conversationId];
      if (list) {
        const msg = list.find((m) => m.id === action.payload.messageId);
        if (msg) msg.isRecalled = true;
      }
    },
    toggleMessageReaction(
      state,
      action: PayloadAction<{
        conversationId: string;
        messageId: string;
        userId: string;
        emoji: string;
        added: boolean;
      }>,
    ) {
      const list = state.byConvId[action.payload.conversationId];
      if (!list) return;

      const msg = list.find((m) => m.id === action.payload.messageId);
      if (!msg) return;

      if (!msg.reactions) {
        msg.reactions = [];
      }

      const reactionIndex = msg.reactions.findIndex((r) => r.emoji === action.payload.emoji);

      if (action.payload.added) {
        // Add reaction
        if (reactionIndex >= 0) {
          // Emoji exists, add user if not already there
          if (!msg.reactions[reactionIndex].userIds.includes(action.payload.userId)) {
            msg.reactions[reactionIndex].userIds.push(action.payload.userId);
          }
        } else {
          // New emoji
          msg.reactions.push({
            emoji: action.payload.emoji,
            userIds: [action.payload.userId],
          });
        }
      } else {
        // Remove reaction
        if (reactionIndex >= 0) {
          msg.reactions[reactionIndex].userIds = msg.reactions[reactionIndex].userIds.filter(
            (uid) => uid !== action.payload.userId,
          );
          // Remove emoji if no more users
          if (msg.reactions[reactionIndex].userIds.length === 0) {
            msg.reactions.splice(reactionIndex, 1);
          }
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        state.loadingConvIds.push(action.meta.arg);
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { conversationId, messages, hasMore } = action.payload;
        state.loadingConvIds = state.loadingConvIds.filter((id) => id !== conversationId);
        state.byConvId[conversationId] = messages;
        state.hasMoreByConvId[conversationId] = hasMore;
        state.pageByConvId[conversationId] = 1;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loadingConvIds = state.loadingConvIds.filter((id) => id !== action.meta.arg);
      })
      .addCase(fetchMoreMessages.pending, (state, action) => {
        state.loadingMoreConvIds.push(action.meta.arg);
      })
      .addCase(fetchMoreMessages.fulfilled, (state, action) => {
        const { conversationId, messages, page, hasMore } = action.payload;
        state.loadingMoreConvIds = state.loadingMoreConvIds.filter((id) => id !== conversationId);
        // Prepend older messages at the beginning
        state.byConvId[conversationId] = [...messages, ...(state.byConvId[conversationId] ?? [])];
        state.hasMoreByConvId[conversationId] = hasMore;
        state.pageByConvId[conversationId] = page;
      })
      .addCase(fetchMoreMessages.rejected, (state, action) => {
        state.loadingMoreConvIds = state.loadingMoreConvIds.filter((id) => id !== action.meta.arg);
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const list = state.byConvId[action.payload.conversationId];
        if (list) {
          const exists = list.some((m) => m.id === action.payload.message.id);
          if (!exists) list.push(action.payload.message);
        }
      })
      .addCase(recallMessage.fulfilled, (state, action) => {
        const list = state.byConvId[action.payload.conversationId];
        if (list) {
          const msg = list.find((m) => m.id === action.payload.messageId);
          if (msg) msg.isRecalled = true;
        }
      });
  },
});

export const {
  addRealTimeMessage,
  replaceTempMessage,
  clearMessages,
  toggleMessageReaction,
  hideMessage,
  markRecalled,
} = messageSlice.actions;
export default messageSlice.reducer;
