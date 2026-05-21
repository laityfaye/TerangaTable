'use client';

import { useState, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { makeQueryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';

const AUTH_PAGES = ['/login', '/forgot-password', '/reset-password'];

function SessionRestorer() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const pathname = usePathname();

  // useLayoutEffect runs synchronously after DOM commit and BEFORE useEffect,
  // which is when React Query fires its first fetch. This ensures the access
  // token and user are in the store before any authenticated request is made,
  // without causing a server/client hydration mismatch (useLayoutEffect is
  // silently skipped during SSR).
  // Skip the cookie-based slow path on auth pages: if the user is not logged
  // in, /api/auth/session would return 401 and produce console noise.
  useLayoutEffect(() => {
    const skipSlowPath = AUTH_PAGES.some((p) => pathname.startsWith(p));
    void restoreSession(skipSlowPath);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SessionRestorer />
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
