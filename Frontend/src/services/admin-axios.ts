import axios from "axios";
import { API_URL } from "../config";

const adminApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: Add admin token
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 and refresh token
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
}

adminApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return adminApi(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("admin_refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      // Call refresh endpoint
      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Update stored tokens
      localStorage.setItem("admin_accessToken", accessToken);
      localStorage.setItem("admin_refreshToken", newRefreshToken);

      // Update authorization header
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      // Process queued requests
      processQueue(null, accessToken);

      // Retry original request
      return adminApi(originalRequest);
    } catch (err) {
      processQueue(err, null);

      // Refresh failed - logout admin
      localStorage.removeItem("admin_accessToken");
      localStorage.removeItem("admin_refreshToken");
      localStorage.removeItem("admin_user");
      window.location.href = "/adminstractor";

      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default adminApi;
