'use client';

import { create } from 'zustand';

export type TenantBlockReason = 'TRIALEXPIRED' | 'ACCOUNTSUSPENDED';

interface TenantStatusState {
  blockReason: TenantBlockReason | null;
  setBlocked: (reason: TenantBlockReason) => void;
  clearBlocked: () => void;
}

export const useTenantStatusStore = create<TenantStatusState>((set) => ({
  blockReason: null,
  setBlocked: (reason) => set({ blockReason: reason }),
  clearBlocked: () => set({ blockReason: null }),
}));
