import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../config/env';
import { authStorage } from './auth-storage';
import type { ApiResponse, AuthTokens } from '../types/auth';

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api = axios.create({
  baseURL: API_URL,
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeRefresh = (cb: (token: string) => void): void => {
  refreshSubscribers.push(cb);
};

const notifyRefreshSubscribers = (token: string): void => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

api.interceptors.request.use((config) => {
  const next = { ...config };
  next.headers = next.headers ?? {};
  next.headers['Cache-Control'] = 'no-cache';
  next.headers.Pragma = 'no-cache';

  const token = authStorage.getAccessToken();
  if (token) {
    next.headers.Authorization = `Bearer ${token}`;
  }

  return next;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const requestUrl = originalRequest.url ?? '';

    if (status !== 401 || requestUrl.includes('/auth/refresh') || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      originalRequest._retry = true;
      const refreshToken = authStorage.getRefreshToken();

      if (!refreshToken) {
        authStorage.clear();
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }

      try {
        const refreshRes = await axios.post<ApiResponse<AuthTokens>>(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        const tokens = refreshRes.data.data;
        authStorage.setTokens(tokens);
        notifyRefreshSubscribers(tokens.accessToken);
        isRefreshing = false;

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;

        return api(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        refreshSubscribers = [];
        authStorage.clear();
        window.location.href = '/auth/login';
        return Promise.reject(refreshErr);
      }
    }

    return new Promise((resolve) => {
      subscribeRefresh((token: string) => {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        resolve(api(originalRequest));
      });
    });
  },
);
