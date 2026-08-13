import { QueryCache, QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useTenantStatusStore, type TenantBlockReason } from '@/stores/tenant-status.store';

const TENANT_BLOCK_CODES: TenantBlockReason[] = ['TRIALEXPIRED', 'ACCOUNTSUSPENDED'];

function handleTenantBlockError(error: unknown) {
  if (!axios.isAxiosError(error)) return;
  const code = (error.response?.data as { error?: { code?: string } })?.error?.code;
  if (code && (TENANT_BLOCK_CODES as string[]).includes(code)) {
    useTenantStatusStore.getState().setBlocked(code as TenantBlockReason);
  }
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: handleTenantBlockError,
      onSuccess: () => useTenantStatusStore.getState().clearBlocked(),
    }),
    defaultOptions: {
      queries: {
        staleTime: 2 * 60_000,    // 2 min — navigation rapide sans re-fetch
        gcTime: 15 * 60_000,      // 15 min — garde les données en mémoire plus longtemps
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      },
    },
  });
}
