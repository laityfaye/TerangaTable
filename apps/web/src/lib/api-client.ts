import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

// Module-level flags to prevent concurrent logout / refresh races
let isLoggingOut = false;
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

export const apiClient = axios.create({
  baseURL: process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Read token from store (in-memory) then sessionStorage fallback
    const token =
      useAuthStore.getState().accessToken ??
      sessionStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    const tenantId =
      useAuthStore.getState().tenantId ?? localStorage.getItem('tenant_id');
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    // Network error or cancelled request (no HTTP response) — never logout
    if (!axios.isAxiosError(error) || !error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const originalRequest = error.config as typeof error.config & {
      _isRetry?: boolean;
    };

    // Don't intercept errors from auth routes themselves (avoids recursive loops)
    if (originalRequest?.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest?._isRetry) {
      originalRequest!._isRetry = true;

      // Another logout already in progress — just reject
      if (isLoggingOut) return Promise.reject(error);

      try {
        // Deduplicate concurrent refresh calls into a single promise
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = useAuthStore
            .getState()
            .refreshTokens()
            .finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
        }
        await refreshPromise;

        // Attach refreshed token and replay original request
        const newToken = useAuthStore.getState().accessToken;
        if (newToken && originalRequest?.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest!);
      } catch {
        // Refresh failed → logout once, then redirect (logout() handles the redirect)
        if (!isLoggingOut) {
          isLoggingOut = true;
          await useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
