import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { authService } from "../../services/auth.service";
import { userService } from "../../services/user.service";
import type { UserDto } from "../../types/api";
import { OnlineStatus } from "../../types/api";

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  status: "idle" | "loading" | "failed";
  error: string | null;
  pendingOtpEmail: string | null;
  requiresApproval: boolean;
}

function loadPersistedAuth(): Partial<AuthState> {
  try {
    const token = localStorage.getItem("accessToken");
    const refresh = localStorage.getItem("refreshToken");
    const user = localStorage.getItem("authUser");
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
  status: "idle",
  error: null,
  pendingOtpEmail: null,
  requiresApproval: false,
  ...loadPersistedAuth(),
};

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      return await authService.login(email, password);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Login failed");
    }
  },
);

export const registerCustomer = createAsyncThunk(
  "auth/registerCustomer",
  async (
    {
      email,
      password,
      displayName,
      phoneNumber,
    }: { email: string; password: string; displayName: string; phoneNumber: string },
    { rejectWithValue },
  ) => {
    try {
      return await authService.registerCustomer(email, password, displayName, phoneNumber);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Registration failed");
    }
  },
);

export const registerEmployee = createAsyncThunk(
  "auth/registerEmployee",
  async (
    {
      inviteCode,
      email,
      password,
      displayName,
      phoneNumber,
    }: { inviteCode: string; email: string; password: string; displayName: string; phoneNumber: string },
    { rejectWithValue },
  ) => {
    try {
      return await authService.registerEmployee(inviteCode, email, password, displayName, phoneNumber);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Registration failed");
    }
  },
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ emailOrPhone, otpCode }: { emailOrPhone: string; otpCode: string }, { rejectWithValue }) => {
    try {
      return await authService.verifyOtp(emailOrPhone, otpCode);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "OTP verification failed");
    }
  },
);

export const resendOtpForUnverified = createAsyncThunk(
  "auth/resendOtpForUnverified",
  async (emailOrPhone: string, { rejectWithValue }) => {
    try {
      return await authService.resendOtp(emailOrPhone);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Failed to resend OTP");
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async ({ displayName, avatarUrl }: { displayName: string; avatarUrl?: string }, { rejectWithValue }) => {
    try {
      return await userService.updateMe(displayName, avatarUrl);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Update failed");
    }
  },
);

export const updateStatus = createAsyncThunk("auth/updateStatus", async (status: OnlineStatus, { rejectWithValue }) => {
  try {
    await userService.updateStatus(status);
    return status;
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error ?? "Status update failed");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: initial,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.pendingOtpEmail = null;
      state.requiresApproval = false;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("authUser");
    },
    clearRegistrationState(state) {
      state.pendingOtpEmail = null;
      state.requiresApproval = false;
      state.error = null;
      state.status = "idle";
    },
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
    },
    clearError(state) {
      state.error = null;
    },
    updateNotificationSettings(state, action) {
      if (state.user) {
        state.user.notificationSettings = action.payload;
        localStorage.setItem("authUser", JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    const handleAuthPending = (state: AuthState) => {
      state.status = "loading";
      state.error = null;
    };
    const handleAuthFulfilled = (
      state: AuthState,
      action: PayloadAction<{ accessToken: string; refreshToken: string; user: UserDto }>,
    ) => {
      state.status = "idle";
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
      localStorage.setItem("authUser", JSON.stringify(action.payload.user));
    };
    const handleAuthRejected = (state: AuthState, action: PayloadAction<unknown>) => {
      state.status = "failed";
      state.error = action.payload as string;
    };

    builder
      .addCase(login.pending, handleAuthPending)
      .addCase(login.fulfilled, handleAuthFulfilled)
      .addCase(login.rejected, handleAuthRejected)
      .addCase(registerCustomer.pending, handleAuthPending)
      .addCase(registerCustomer.fulfilled, (state, action) => {
        state.status = "idle";
        state.pendingOtpEmail = action.meta.arg.email;
      })
      .addCase(registerCustomer.rejected, handleAuthRejected)
      .addCase(registerEmployee.pending, handleAuthPending)
      .addCase(registerEmployee.fulfilled, (state, action) => {
        state.status = "idle";
        state.pendingOtpEmail = action.meta.arg.email;
      })
      .addCase(registerEmployee.rejected, handleAuthRejected)
      .addCase(verifyOtp.pending, handleAuthPending)
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.status = "idle";
        if (action.payload.requiresApproval) {
          state.requiresApproval = true;
          state.pendingOtpEmail = null;
        } else if (action.payload.accessToken && action.payload.refreshToken && action.payload.user) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.pendingOtpEmail = null;
          localStorage.setItem("accessToken", action.payload.accessToken);
          localStorage.setItem("refreshToken", action.payload.refreshToken);
          localStorage.setItem("authUser", JSON.stringify(action.payload.user));
        }
      })
      .addCase(verifyOtp.rejected, handleAuthRejected)
      .addCase(resendOtpForUnverified.pending, handleAuthPending)
      .addCase(resendOtpForUnverified.fulfilled, (state, action) => {
        state.status = "idle";
        // Set pendingOtpEmail từ maskedEmail (sẽ dùng input email từ user)
        // Nhưng vì backend trả về maskedEmail, ta cần lưu email gốc từ input
        // => Ta sẽ dùng maskedEmail như một hint, nhưng user phải nhập lại email để verify
        state.pendingOtpEmail = action.payload.maskedEmail;
      })
      .addCase(resendOtpForUnverified.rejected, handleAuthRejected)
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem("authUser", JSON.stringify(action.payload));
      })
      .addCase(updateStatus.fulfilled, (state, action) => {
        if (state.user) state.user.status = action.payload;
      });
  },
});

export const { logout, setTokens, clearError, updateNotificationSettings, clearRegistrationState } = authSlice.actions;
export default authSlice.reducer;
