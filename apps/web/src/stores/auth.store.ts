'use client';

import { create } from 'zustand';
import axios from 'axios';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string | null;
  tenantSlug: string | null;
  roles: string[];
  regionSlug?: string | null;
  avatarUrl?: string | null;
  /** Slugs des modules actifs pour ce tenant (ex: ['menu', 'orders', 'delivery']) */
  activeModules?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Internal setters used by api.ts interceptor
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  restoreSession: (skipSlowPath?: boolean) => Promise<void>;
}

const API_URL =
  typeof window !== 'undefined'
    ? (process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1')
    : 'http://localhost:3001/v1';

async function setRefreshCookie(refreshToken: string) {
  await fetch('/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
}

async function clearRefreshCookie() {
  await fetch('/api/auth/token', { method: 'DELETE' });
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  tenantId: null,
  isAuthenticated: false,
  isLoading: false,

  setTokens(accessToken, refreshToken) {
    set({ accessToken, refreshToken });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access_token', accessToken);
      sessionStorage.setItem('refresh_token', refreshToken);
    }
  },

  setUser(user) {
    set({ user, tenantId: user.tenantId, isAuthenticated: true });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_user', JSON.stringify(user));
    }
  },

  clearAuth() {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      tenantId: null,
      isAuthenticated: false,
    });
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('auth_user');
    }
    // Cookie cleared explicitly in logout() with proper await — not here
  },

  async login({ email, password }) {
    set({ isLoading: true });
    try {
      const { data } = await axios.post<{
        data: {
          access_token: string;
          refresh_token: string;
          user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            tenantId: string | null;
            tenantSlug: string | null;
            roles: string[];
            regionSlug?: string | null;
            avatarUrl?: string | null;
            activeModules?: string[];
          };
        };
      }>(`${API_URL}/auth/login`, { email, password });

      const { access_token: accessToken, refresh_token: refreshToken, user: raw } = data.data;

      const user: AuthUser = {
        id: raw.id,
        email: raw.email,
        firstName: raw.firstName,
        lastName: raw.lastName,
        tenantId: raw.tenantId,
        tenantSlug: raw.tenantSlug ?? null,
        roles: raw.roles,
        regionSlug: raw.regionSlug ?? null,
        avatarUrl: raw.avatarUrl ?? null,
        activeModules: raw.activeModules ?? [],
      };

      get().setTokens(accessToken, refreshToken);
      get().setUser(user);
      await setRefreshCookie(refreshToken);
    } finally {
      set({ isLoading: false });
    }
  },

  async logout() {
    const { refreshToken } = get();
    get().clearAuth();
    await Promise.allSettled([
      refreshToken ? axios.post(`${API_URL}/auth/logout`, { refreshToken }) : Promise.resolve(),
      clearRefreshCookie(),
    ]);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  async refreshTokens() {
    const { refreshToken: storeRefreshToken } = get();
    const refreshToken =
      storeRefreshToken ??
      (typeof window !== 'undefined' ? sessionStorage.getItem('refresh_token') : null);
    if (!refreshToken) throw new Error('No refresh token');

    const { data } = await axios.post<{
      data: { access_token: string; refresh_token: string };
    }>(`${API_URL}/auth/refresh`, {}, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });

    get().setTokens(data.data.access_token, data.data.refresh_token);
    await setRefreshCookie(data.data.refresh_token);
  },

  async restoreSession(skipSlowPath = false) {
    if (typeof window === 'undefined') return;
    if (get().isAuthenticated) return;

    // Fast path: sessionStorage survives page reloads within the same tab
    const token = sessionStorage.getItem('access_token');
    const refresh = sessionStorage.getItem('refresh_token');
    const rawUser = sessionStorage.getItem('auth_user');

    if (token) {
      try {
        const user = rawUser ? (JSON.parse(rawUser) as AuthUser) : null;
        set({
          accessToken: token,
          ...(refresh ? { refreshToken: refresh } : {}),
          ...(user ? { user, tenantId: user.tenantId, isAuthenticated: true } : {}),
        });
      } catch {
        set({ accessToken: token });
      }
      return;
    }

    // Slow path: sessionStorage was cleared (new tab / browser restart) but the
    // httpOnly refresh cookie is still alive. Restore via the server-side route
    // which reads the cookie, rotates tokens, and returns a fresh user object.
    // Skip on auth pages (login, etc.) to avoid a 401 when no cookie exists.
    // Guard: prevent concurrent calls (React 18 StrictMode double-invokes effects).
    if (skipSlowPath || get().isLoading) return;
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/session');
      if (!res.ok) return;

      const body = (await res.json()) as {
        access_token: string;
        refresh_token: string;
        user: AuthUser;
      };

      get().setTokens(body.access_token, body.refresh_token);
      get().setUser(body.user);
    } catch {
      // Silently ignore — middleware will redirect to /login if the cookie is gone
    } finally {
      set({ isLoading: false });
    }
  },
}));
