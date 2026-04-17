import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { conversationService } from '../../services/conversation.service';
import { mapMessage, mapConversation } from '../../types/mappers';
import { upsertConversation } from './conversationSlice';
import type { Message } from '../../types';
import type { MessageDto } from '../../types/api';
import { MessageType } from '../../types/api';
import type { RootState } from '../index';

interface MessageState {
  byConvId: Record<string, Message[]>;
  loadingConvIds: string[];
}

const initial: MessageState = {
  byConvId: {},
  loadingConvIds: [],
};

export const fetchMessages = createAsyncThunk('messages/fetch', async (conversationId: string, { rejectWithValue }) => {
  try {
    const dtos = await conversationService.getMessages(conversationId);
    return { conversationId, messages: dtos.map(mapMessage) };
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error ?? 'Failed to load messages');
  }
});

export const sendMessage = createAsyncThunk(
  'messages/send',
  async (
    payload: {
      conversationId: string;
      type: MessageType;
      content: string | null;
      options?: { fileUrl?: string; fileName?: string; fileSize?: number; replyToMessageId?: string };
    },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const dto = await conversationService.sendMessage(
        payload.conversationId,
        payload.type,
        payload.content,
        payload.options
      );
      const msg = mapMessage(dto);

      // Refresh conversation list to update lastMessage
      const state = getState() as RootState;
      const currentUserId = state.auth.user?.id ?? '';
      const convDtos = await conversationService.getAll();
      for (const convDto of convDtos) {
        dispatch(upsertConversation(mapConversation(convDto, currentUserId)));
      }

      return { conversationId: payload.conversationId, message: msg };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Failed to send message');
    }
  }
);

export const recallMessage = createAsyncThunk('messages/recall', async ({ conversationId, messageId }: { conversationId: string; messageId: string }, { rejectWithValue }) => {
  try {
    await conversationService.recallMessage(conversationId, messageId);
    return { conversationId, messageId };
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error ?? 'Failed to recall message');
  }
});

const messageSlice = createSlice({
  name: 'messages',
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        state.loadingConvIds.push(action.meta.arg);
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loadingConvIds = state.loadingConvIds.filter((id) => id !== action.payload.conversationId);
        state.byConvId[action.payload.conversationId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loadingConvIds = state.loadingConvIds.filter((id) => id !== action.meta.arg);
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

export const { addRealTimeMessage, replaceTempMessage, clearMessages } = messageSlice.actions;
export default messageSlice.reducer;
