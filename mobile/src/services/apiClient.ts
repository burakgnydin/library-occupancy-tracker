import axios, { AxiosError, InternalAxiosRequestConfig, isAxiosError } from 'axios';

import { secureStorage } from './secureStorage';
import { resolveApiBaseUrl } from '../utils/apiBaseUrl';
import type { AuthResponse, RefreshRequest } from '../types/auth';

export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

const REQUEST_TIMEOUT_MS = 15000;
const REFRESH_TIMEOUT_MS = 10000;

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: REQUEST_TIMEOUT_MS,
});

type SessionRefreshedHandler = (
  session: Pick<AuthResponse, 'accessToken' | 'refreshToken' | 'role'>,
) => void | Promise<void>;
type UnauthorizedHandler = () => void | Promise<void>;

// apiClient authStore'u dogrudan tanimaz (dongusel bagimliligi onlemek icin) -
// bu iki olay disaridan (authStore modulu yuklenirken) kaydedilir.
let onSessionRefreshed: SessionRefreshedHandler | null = null;
let onUnauthorized: UnauthorizedHandler | null = null;

export function registerSessionRefreshedHandler(handler: SessionRefreshedHandler) {
  onSessionRefreshed = handler;
}

export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  onUnauthorized = handler;
}

apiClient.interceptors.request.use(async (config) => {
  const accessToken = await secureStorage.getItem(ACCESS_TOKEN_KEY);
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

type PendingRequestCallback = (accessToken: string | null) => void;

// Refresh token rotation nedeniyle ayni anda birden fazla refresh cagrisi
// yapilamaz (biri kazanir, digeri "already used" hatasi alir) - bu yuzden
// paralel 401'ler tek bir refresh cagrisinda kuyruklanir.
let isRefreshing = false;
let pendingRequests: PendingRequestCallback[] = [];

function resolvePendingRequests(accessToken: string | null) {
  pendingRequests.forEach((resolve) => resolve(accessToken));
  pendingRequests = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isRefreshCall) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push((accessToken) => {
          if (!accessToken) {
            reject(error);
            return;
          }
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        resolvePendingRequests(null);
        await onUnauthorized?.();
        return Promise.reject(error);
      }

      const payload: RefreshRequest = { refreshToken };
      const { data } = await apiClient.post<AuthResponse>('/auth/refresh', payload, {
        timeout: REFRESH_TIMEOUT_MS,
      });

      await onSessionRefreshed?.({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        role: data.role,
      });

      resolvePendingRequests(data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      resolvePendingRequests(null);

      // Sadece refresh endpoint'i gercekten 401 donduyse (token gecersiz/
      // expired/revoked) oturumu kapat. Ag hatasi/timeout durumunda mevcut
      // refresh token hala gecerli olabilir - oturumu bozmadan orijinal
      // hatayi yukari firlat, cagiran taraf tekrar deneyebilsin.
      if (isAxiosError(refreshError) && refreshError.response?.status === 401) {
        await onUnauthorized?.();
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
