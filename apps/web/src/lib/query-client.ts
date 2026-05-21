import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,        // 1 min — serve from cache on re-navigation
        gcTime: 10 * 60_000,      // 10 min — keep inactive query data in memory
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      },
    },
  });
}
