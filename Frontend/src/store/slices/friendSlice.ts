import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { friendService } from "../../services/friend.service";
import { mapUser } from "../../types/mappers";
import type { User, FriendRequest } from "../../types";
import type { FriendRequestDto } from "../../types/api";

interface FriendState {
  friends: User[];
  requests: FriendRequest[];
  requestDetails: FriendRequestDto[];
  sentRequests: string[]; // User IDs of people we've sent friend requests to
  status: "idle" | "loading" | "failed";
}

const initial: FriendState = {
  friends: [],
  requests: [],
  requestDetails: [],
  sentRequests: [],
  status: "idle",
};

export const fetchFriends = createAsyncThunk("friends/fetchFriends", async (_, { rejectWithValue }) => {
  try {
    const dtos = await friendService.getFriends();
    return dtos.map(mapUser);
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error ?? "Failed");
  }
});

export const fetchFriendRequests = createAsyncThunk("friends/fetchRequests", async (_, { rejectWithValue }) => {
  try {
    return await friendService.getRequests();
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error ?? "Failed");
  }
});

export const sendFriendRequest = createAsyncThunk(
  "friends/sendRequest",
  async (toUserId: string, { rejectWithValue }) => {
    try {
      await friendService.sendRequest(toUserId);
      return toUserId;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Failed");
    }
  },
);

export const cancelFriendRequest = createAsyncThunk(
  "friends/cancelRequest",
  async (toUserId: string, { rejectWithValue }) => {
    try {
      await friendService.cancelRequest(toUserId);
      return toUserId;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Failed");
    }
  },
);

export const acceptFriendRequest = createAsyncThunk(
  "friends/acceptRequest",
  async (requestId: string, { dispatch, rejectWithValue }) => {
    try {
      await friendService.acceptRequest(requestId);
      dispatch(fetchFriends());
      dispatch(fetchFriendRequests());
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Failed");
    }
  },
);

export const rejectFriendRequest = createAsyncThunk(
  "friends/rejectRequest",
  async (requestId: string, { dispatch, rejectWithValue }) => {
    try {
      await friendService.rejectRequest(requestId);
      dispatch(fetchFriendRequests());
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Failed");
    }
  },
);

export const unfriendUser = createAsyncThunk(
  "friends/unfriend",
  async (friendId: string, { dispatch, rejectWithValue }) => {
    try {
      await friendService.unfriend(friendId);
      dispatch(fetchFriends());
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? "Failed");
    }
  },
);

const friendSlice = createSlice({
  name: "friends",
  initialState: initial,
  reducers: {
    setUserStatus(state, action: PayloadAction<{ userId: string; isOnline: boolean; status?: number }>) {
      const friend = state.friends.find((f) => f.id === action.payload.userId);
      if (friend) {
        friend.isOnline = action.payload.isOnline;
        if (action.payload.status !== undefined) {
          friend.status = action.payload.status;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFriends.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.status = "idle";
        state.friends = action.payload;
      })
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        // Add to sent requests list
        if (!state.sentRequests.includes(action.payload)) {
          state.sentRequests.push(action.payload);
        }
      })
      .addCase(cancelFriendRequest.fulfilled, (state, action) => {
        // Remove from sent requests list
        state.sentRequests = state.sentRequests.filter((id) => id !== action.payload);
      })
      .addCase(acceptFriendRequest.fulfilled, (state) => {
        // When accepting a friend request, clear sent requests (friend list will be refreshed)
        state.sentRequests = [];
      })
      .addCase(fetchFriends.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(fetchFriendRequests.fulfilled, (state, action) => {
        state.requestDetails = action.payload;
        state.requests = action.payload.map((dto) => ({
          id: dto.id,
          fromUserId: dto.fromUser.id,
          toUserId: "",
          status: "pending" as const,
          timestamp: dto.createdAt,
        }));
      });
  },
});

export const { setUserStatus } = friendSlice.actions;
export default friendSlice.reducer;
