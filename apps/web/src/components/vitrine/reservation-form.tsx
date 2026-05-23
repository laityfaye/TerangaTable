'use client';

import { useState } from 'react';
import type { PublicReservationPayload, PublicReservationResult } from '@/types/vitrine';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1';

const TIME_SLOTS = [
  '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
];

interface Props {
  slug: string;
  primaryColor: string;
  openingHours: Record<string, { open: string; close: string } | 'closed'> | null;
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function ReservationForm({ slug, primaryColor, openingHours }: Props) {
  const [form, setForm] = useState<PublicReservationPayload>({
    date: '',
    time: '',
    party_size: 2,
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    notes: '',
  });
  const [state, setState] = useState<FormState>('idle');
  const [result, setResult] = useState<PublicReservationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const today = new Date().toISOString().split('T')[0];

  function isDateDisabled(dateStr: string): boolean {
    if (!openingHours) return false;
    const day = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hours = openingHours[day];
    return !hours || hours === 'closed';
  }

  function set<K extends keyof PublicReservationPayload>(key: K, value: PublicReservationPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/public/${slug}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          party_size: Number(form.party_size),
          customer_email: form.customer_email || undefined,
          notes: form.notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? 'Une erreur est survenue.');
      }

      const json = (await res.json()) as { data: PublicReservationResult } | PublicReservationResult;
      const data = 'data' in json ? json.data : json;
      setResult(data);
      setState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setState('error');
    }
  }

  if (state === 'success' && result) {
    return (
      <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-md p-8 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${primaryColor}18` }}
        >
          <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#1C1917] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Réservation confirmée !
        </h2>
        <p className="text-[#57534E] text-sm mb-4">
          Votre demande a bien été reçue. Nous vous contacterons pour confirmer votre réservation.
        </p>
        <div className="bg-[#FAFAF8] rounded-lg p-4 text-left text-sm space-y-1">
          <p><span className="font-medium text-[#1C1917]">Nom :</span> {result.customerName}</p>
          <p>
            <span className="font-medium text-[#1C1917]">Date :</span>{' '}
            {new Date(result.reservedAt).toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
          <p>
            <span className="font-medium text-[#1C1917]">Heure :</span>{' '}
            {new Date(result.reservedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p><span className="font-medium text-[#1C1917]">Couverts :</span> {result.partySize}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[#E7E5E4] shadow-md p-6 sm:p-8 space-y-5">
      <h2 className="text-xl font-bold text-[#1C1917]" style={{ fontFamily: 'var(--font-heading)' }}>
        Votre réservation
      </h2>

      {/* Date + Heure */}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#1C1917]">
            Date <span className="text-red-500">*</span>
          </span>
          <input
            type="date"
            required
            min={today}
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] focus:border-transparent"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
          {form.date && isDateDisabled(form.date) && (
            <span className="text-xs text-red-500">Le restaurant est fermé ce jour-là.</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#1C1917]">
            Heure <span className="text-red-500">*</span>
          </span>
          <select
            required
            value={form.time}
            onChange={(e) => set('time', e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm focus:outline-none focus:ring-2 bg-white"
          >
            <option value="">Choisir...</option>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Couverts */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[#1C1917]">
          Nombre de couverts <span className="text-red-500">*</span>
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set('party_size', Math.max(1, form.party_size - 1))}
            className="w-10 h-10 rounded-full border border-[#E7E5E4] flex items-center justify-center text-[#1C1917] hover:bg-[#F5F4F2] transition-colors text-lg font-medium"
          >
            −
          </button>
          <span className="text-lg font-semibold text-[#1C1917] w-8 text-center">{form.party_size}</span>
          <button
            type="button"
            onClick={() => set('party_size', Math.min(50, form.party_size + 1))}
            className="w-10 h-10 rounded-full border border-[#E7E5E4] flex items-center justify-center text-[#1C1917] hover:bg-[#F5F4F2] transition-colors text-lg font-medium"
          >
            +
          </button>
        </div>
      </label>

      {/* Nom */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[#1C1917]">
          Nom complet <span className="text-red-500">*</span>
        </span>
        <input
          type="text"
          required
          placeholder="Moussa Diallo"
          value={form.customer_name}
          onChange={(e) => set('customer_name', e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm focus:outline-none focus:ring-2 focus:border-transparent"
        />
      </label>

      {/* Téléphone */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[#1C1917]">
          Téléphone <span className="text-red-500">*</span>
        </span>
        <input
          type="tel"
          required
          placeholder="+221 77 123 45 67"
          value={form.customer_phone}
          onChange={(e) => set('customer_phone', e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm focus:outline-none focus:ring-2 focus:border-transparent"
        />
      </label>

      {/* Email */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[#1C1917]">Email (optionnel)</span>
        <input
          type="email"
          placeholder="votre@email.com"
          value={form.customer_email}
          onChange={(e) => set('customer_email', e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm focus:outline-none focus:ring-2 focus:border-transparent"
        />
      </label>

      {/* Message */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[#1C1917]">Message (optionnel)</span>
        <textarea
          rows={3}
          placeholder="Occasion spéciale, préférence de table, allergie..."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          className="w-full px-3 py-2.5 rounded-md border border-[#E7E5E4] text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
        />
      </label>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={state === 'loading' || (!!form.date && isDateDisabled(form.date))}
        className="w-full h-12 rounded-full font-semibold text-white text-sm tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: primaryColor }}
      >
        {state === 'loading' ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Envoi en cours...
          </>
        ) : (
          'Confirmer la réservation'
        )}
      </button>

      <p className="text-xs text-center text-[#57534E]">
        Nous vous contacterons par téléphone pour confirmer votre réservation.
      </p>
    </form>
  );
}
