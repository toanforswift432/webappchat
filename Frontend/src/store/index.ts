import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import conversationReducer from './slices/conversationSlice';
import messageReducer from './slices/messageSlice';
import friendReducer from './slices/friendSlice';
import uiReducer from './slices/uiSlice';
import callReducer from './slices/callSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    conversations: conversationReducer,
    messages: messageReducer,
    friends: friendReducer,
    ui: uiReducer,
    call: callReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ['payload.messageToForward'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
