'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1';

export default function ReviewReportButton({ reviewId }: { reviewId: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  async function handleReport() {
    setState('sending');
    try {
      await fetch(`${API_URL}/public/reviews/${reviewId}/report`, { method: 'POST' });
      setState('sent');
    } catch {
      setState('idle');
    }
  }

  if (state === 'sent') {
    return <span className="text-xs text-slate-400">Signalement envoyé</span>;
  }

  return (
    <button
      onClick={handleReport}
      disabled={state === 'sending'}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
    >
      <Flag size={12} />
      Signaler
    </button>
  );
}
