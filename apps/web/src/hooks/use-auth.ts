'use client';

import { useAuthStore, type AuthUser, type LoginCredentials } from '@/stores/auth.store';
import { UserRole } from '@terangatable/shared';

export type { AuthUser, LoginCredentials };

export function useAuth() {
  const store = useAuthStore();
  // Session restored globally in Providers — no need to call here

  const hasRole = (role: UserRole | string) => store.user?.roles.includes(role) ?? false;

  const isSuperAdmin = hasRole(UserRole.SUPER_ADMIN);
  const isManager = hasRole(UserRole.MANAGER) || isSuperAdmin;
  const isAdmin = isSuperAdmin || hasRole(UserRole.REGIONAL_ADMIN);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    accessToken: store.accessToken,
    tenantId: store.tenantId,
    isSuperAdmin,
    isManager,
    isAdmin,
    hasRole,
    login: store.login,
    logout: store.logout,
    refreshTokens: store.refreshTokens,
  };
}
