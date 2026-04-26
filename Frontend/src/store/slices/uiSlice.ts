import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppTab, AppNotification } from '../../types';
import type { Message } from '../../types';

interface UIState {
  activeTab: AppTab;
  isDarkMode: boolean;
  isNotificationsOpen: boolean;
  isSearchOpen: boolean;
  messageToForward: Message | null;
  typingConvIds: string[];
  notifications: AppNotification[];
}

const initial: UIState = {
  activeTab: 'chat',
  isDarkMode: localStorage.getItem('darkMode') === 'true',
  isNotificationsOpen: false,
  isSearchOpen: false,
  messageToForward: null,
  typingConvIds: [],
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: initial,
  reducers: {
    setActiveTab(state, action: PayloadAction<AppTab>) {
      state.activeTab = action.payload;
    },
    toggleDarkMode(state) {
      state.isDarkMode = !state.isDarkMode;
      localStorage.setItem('darkMode', String(state.isDarkMode));
    },
    setDarkMode(state, action: PayloadAction<boolean>) {
      state.isDarkMode = action.payload;
      localStorage.setItem('darkMode', String(action.payload));
    },
    setNotificationsOpen(state, action: PayloadAction<boolean>) {
      state.isNotificationsOpen = action.payload;
    },
    setSearchOpen(state, action: PayloadAction<boolean>) {
      state.isSearchOpen = action.payload;
    },
    setMessageToForward(state, action: PayloadAction<Message | null>) {
      state.messageToForward = action.payload;
    },
    setTyping(state, action: PayloadAction<{ convId: string; isTyping: boolean }>) {
      if (action.payload.isTyping) {
        if (!state.typingConvIds.includes(action.payload.convId)) {
          state.typingConvIds.push(action.payload.convId);
        }
      } else {
        state.typingConvIds = state.typingConvIds.filter((id) => id !== action.payload.convId);
      }
    },
    addNotification(state, action: PayloadAction<AppNotification>) {
      // Add to beginning (most recent first)
      state.notifications.unshift(action.payload);
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    markNotificationRead(state, action: PayloadAction<string>) {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif) notif.isRead = true;
    },
    markAllNotificationsRead(state) {
      state.notifications.forEach((n) => (n.isRead = true));
    },
  },
});

export const {
  setActiveTab,
  toggleDarkMode,
  setDarkMode,
  setNotificationsOpen,
  setSearchOpen,
  setMessageToForward,
  setTyping,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
} = uiSlice.actions;

export default uiSlice.reducer;
