'use client';

import { useAuthStore } from '@/stores/auth.store';

export function useTenant() {
  const user = useAuthStore((s) => s.user);
  const tenantId = useAuthStore((s) => s.tenantId);

  return {
    tenantId,
    hasTenant: tenantId !== null,
    userId: user?.id ?? null,
  };
}
