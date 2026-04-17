import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { conversationService } from '../../services/conversation.service';
import { mapConversation } from '../../types/mappers';
import type { Conversation } from '../../types';
import type { RootState } from '../index';

interface ConversationState {
  items: Conversation[];
  activeId: string | null;
  status: 'idle' | 'loading' | 'failed';
}

const initial: ConversationState = {
  items: [],
  activeId: null,
  status: 'idle',
};

export const fetchConversations = createAsyncThunk('conversations/fetchAll', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState() as RootState;
    const currentUserId = state.auth.user?.id ?? '';
    const dtos = await conversationService.getAll();
    return dtos.map((dto) => mapConversation(dto, currentUserId));
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error ?? 'Failed to load conversations');
  }
});

export const getOrCreateDirect = createAsyncThunk('conversations/getOrCreateDirect', async (otherUserId: string, { getState, rejectWithValue }) => {
  try {
    const state = getState() as RootState;
    const currentUserId = state.auth.user?.id ?? '';
    const dto = await conversationService.getOrCreateDirect(otherUserId);
    return mapConversation(dto, currentUserId);
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error ?? 'Failed');
  }
});

export const createGroup = createAsyncThunk('conversations/createGroup', async ({ name, memberIds }: { name: string; memberIds: string[] }, { getState, rejectWithValue }) => {
  try {
    const state = getState() as RootState;
    const currentUserId = state.auth.user?.id ?? '';
    const dto = await conversationService.createGroup(name, memberIds);
    return mapConversation(dto, currentUserId);
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error ?? 'Failed to create group');
  }
});

const conversationSlice = createSlice({
  name: 'conversations',
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchConversations.rejected, (state) => { state.status = 'failed'; })
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

export const { setActiveConversation, upsertConversation, removeConversation, bumpUnread } = conversationSlice.actions;
export default conversationSlice.reducer;
