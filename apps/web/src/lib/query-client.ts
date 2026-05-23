import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
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
