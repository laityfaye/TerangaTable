import axios from 'axios';

const API_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Lazy-import the store to avoid circular dependency at module init time
function getStore() {
  return require('../stores/auth.store').useAuthStore;
}

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];
let rejectQueue: Array<(err: unknown) => void> = [];

function resolveQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
  rejectQueue = [];
}

function rejectAllQueue(err: unknown) {
  rejectQueue.forEach((cb) => cb(err));
  refreshQueue = [];
  rejectQueue = [];
}

// Request interceptor — inject auth headers
apiClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;

  const store = getStore();
  const { accessToken, tenantId } = store.getState();

  const token = accessToken ?? sessionStorage.getItem('access_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) config.headers['X-Tenant-ID'] = tenantId;

  return config;
});

// Response interceptor — handle 401 with single refresh attempt
apiClient.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      typeof window === 'undefined'
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const store = getStore();
    const { refreshToken: storeRefreshToken } = store.getState();
    const refreshToken =
      storeRefreshToken ?? sessionStorage.getItem('refresh_token');

    if (!refreshToken) {
      store.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          originalRequest!.headers!['Authorization'] = `Bearer ${token}`;
          resolve(apiClient(originalRequest!));
        });
        rejectQueue.push(reject);
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axios.post<{
        data: { access_token: string; refresh_token: string };
      }>(`${API_URL}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${refreshToken}` },
      });

      const newAccess = data.data.access_token;
      const newRefresh = data.data.refresh_token;

      store.getState().setTokens(newAccess, newRefresh);

      resolveQueue(newAccess);
      isRefreshing = false;

      originalRequest!.headers!['Authorization'] = `Bearer ${newAccess}`;
      return apiClient(originalRequest!);
    } catch (refreshErr) {
      rejectAllQueue(refreshErr);
      isRefreshing = false;
      store.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    }
  },
);
