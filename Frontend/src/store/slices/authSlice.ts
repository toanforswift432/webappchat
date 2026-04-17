import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/auth.service';
import { userService } from '../../services/user.service';
import type { UserDto } from '../../types/api';
import { OnlineStatus } from '../../types/api';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

function loadPersistedAuth(): Partial<AuthState> {
  try {
    const token = localStorage.getItem('accessToken');
    const refresh = localStorage.getItem('refreshToken');
    const user = localStorage.getItem('authUser');
    if (token && refresh && user) {
      return { accessToken: token, refreshToken: refresh, user: JSON.parse(user), isAuthenticated: true };
    }
  } catch {
    // ignore
  }
  return {};
}

const initial: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  status: 'idle',
  error: null,
  ...loadPersistedAuth(),
};

export const login = createAsyncThunk('auth/login', async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
  try {
    return await authService.login(email, password);
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error ?? 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async ({ email, password, displayName }: { email: string; password: string; displayName: string }, { rejectWithValue }) => {
  try {
    return await authService.register(email, password, displayName);
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error ?? 'Registration failed');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async ({ displayName, avatarUrl }: { displayName: string; avatarUrl?: string }, { rejectWithValue }) => {
  try {
    return await userService.updateMe(displayName, avatarUrl);
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error ?? 'Update failed');
  }
});

export const updateStatus = createAsyncThunk('auth/updateStatus', async (status: OnlineStatus, { rejectWithValue }) => {
  try {
    await userService.updateStatus(status);
    return status;
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error ?? 'Status update failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authUser');
    },
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handleAuthPending = (state: AuthState) => {
      state.status = 'loading';
      state.error = null;
    };
    const handleAuthFulfilled = (state: AuthState, action: PayloadAction<{ accessToken: string; refreshToken: string; user: UserDto }>) => {
      state.status = 'idle';
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      localStorage.setItem('authUser', JSON.stringify(action.payload.user));
    };
    const handleAuthRejected = (state: AuthState, action: PayloadAction<unknown>) => {
      state.status = 'failed';
      state.error = action.payload as string;
    };

    builder
      .addCase(login.pending, handleAuthPending)
      .addCase(login.fulfilled, handleAuthFulfilled)
      .addCase(login.rejected, handleAuthRejected)
      .addCase(register.pending, handleAuthPending)
      .addCase(register.fulfilled, handleAuthFulfilled)
      .addCase(register.rejected, handleAuthRejected)
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('authUser', JSON.stringify(action.payload));
      })
      .addCase(updateStatus.fulfilled, (state, action) => {
        if (state.user) state.user.status = action.payload;
      });
  },
});

export const { logout, setTokens, clearError } = authSlice.actions;
export default authSlice.reducer;
