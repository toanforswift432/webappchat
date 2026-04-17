import axios from 'axios';
import type { Store } from '@reduxjs/toolkit';

const api = axios.create({
  baseURL: 'http://localhost:5054/api',
  headers: { 'Content-Type': 'application/json' },
});

let store: Store;

export function injectStore(_store: Store) {
  store = _store;
}

api.interceptors.request.use((config) => {
  if (store) {
    const state = store.getState() as { auth: { accessToken: string | null } };
    const token = state.auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const state = store.getState() as { auth: { refreshToken: string | null } };
      const refreshToken = state.auth.refreshToken;
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post('http://localhost:5054/api/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = data;

      const { setTokens } = await import('../store/slices/authSlice');
      store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      processQueue(null, accessToken);
      return api(originalRequest);
    } catch (err) {
      processQueue(err, null);
      const { logout } = await import('../store/slices/authSlice');
      store.dispatch(logout());
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
