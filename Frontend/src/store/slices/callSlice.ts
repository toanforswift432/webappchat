import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CallType = 'audio' | 'video';
export type CallStatus = 'ringing' | 'connecting' | 'active' | 'ended';

interface ActiveCall {
  id: string;
  conversationId: string;
  type: CallType;
  status: CallStatus;
  isInitiator: boolean;
  participants: string[];
  startTime?: number;
}

interface IncomingCall {
  id: string;
  conversationId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  type: CallType;
  offer: string;
}

interface CallState {
  activeCall: ActiveCall | null;
  incomingCall: IncomingCall | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

const initialState: CallState = {
  activeCall: null,
  incomingCall: null,
  isVideoEnabled: true,
  isAudioEnabled: true,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    setIncomingCall(state, action: PayloadAction<IncomingCall>) {
      state.incomingCall = action.payload;
    },
    clearIncomingCall(state) {
      state.incomingCall = null;
    },
    setActiveCall(state, action: PayloadAction<ActiveCall>) {
      state.activeCall = action.payload;
      state.incomingCall = null;
    },
    updateCallStatus(state, action: PayloadAction<CallStatus>) {
      if (state.activeCall) {
        state.activeCall.status = action.payload;
        if (action.payload === 'active' && !state.activeCall.startTime) {
          state.activeCall.startTime = Date.now();
        }
      }
    },
    addParticipant(state, action: PayloadAction<string>) {
      if (state.activeCall && !state.activeCall.participants.includes(action.payload)) {
        state.activeCall.participants.push(action.payload);
      }
    },
    removeParticipant(state, action: PayloadAction<string>) {
      if (state.activeCall) {
        state.activeCall.participants = state.activeCall.participants.filter(
          (id) => id !== action.payload
        );
      }
    },
    setVideoEnabled(state, action: PayloadAction<boolean>) {
      state.isVideoEnabled = action.payload;
    },
    setAudioEnabled(state, action: PayloadAction<boolean>) {
      state.isAudioEnabled = action.payload;
    },
    clearCall(state) {
      state.activeCall = null;
      state.incomingCall = null;
      state.isVideoEnabled = true;
      state.isAudioEnabled = true;
    },
  },
});

export const {
  setIncomingCall,
  clearIncomingCall,
  setActiveCall,
  updateCallStatus,
  addParticipant,
  removeParticipant,
  setVideoEnabled,
  setAudioEnabled,
  clearCall,
} = callSlice.actions;

export default callSlice.reducer;
