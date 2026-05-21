'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api-client'
import type { WizardState, WizardAction } from '../page'

const SERVICE_LABELS: Record<string, string> = {
  dine_in: '🍽️ Sur place',
  takeaway: '🥡 À emporter',
  delivery: '🛵 Livraison',
  online: '📱 Commande en ligne',
}

const TEAM_LABELS: Record<string, string> = {
  solo: '👤 Seul',
  '2-5': '👥 2–5 personnes',
  '6-15': '👨‍👩‍👧‍👦 6–15 personnes',
  '16+': '🏢 16 et plus',
}

const MODULE_LABELS: Record<string, string> = {
  website: '📱 Site vitrine',
  pos: '🏧 Caisse POS',
  reservations: '📅 Réservations',
  delivery: '🚀 Livraison',
  crm: '👥 CRM Clients',
  analytics: '📊 Analytics',
}

export default function Step4Confirm({
  state,
  dispatch,
  onBack,
  onSubmitted,
}: {
  state: WizardState
  dispatch: React.Dispatch<WizardAction>
  onBack: () => void
  onSubmitted: (id: string) => void
}) {
  const [cguAccepted, setCguAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!cguAccepted || state.isSubmitting) return
    dispatch({ type: 'SET_SUBMITTING', value: true })
    setError(null)
    try {
      const res = await apiClient.post('/tenant-requests', {
        regionId: state.region?.id,
        ownerName: `${state.firstName} ${state.lastName}`.trim(),
        ownerEmail: state.ownerEmail,
        restaurantName: state.restaurantName,
        phone: state.phone || undefined,
        city: state.city || undefined,
        message: state.message || undefined,
      })
      const id: string = res.data?.data?.id ?? 'demo'
      onSubmitted(id)
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.")
      dispatch({ type: 'SET_SUBMITTING', value: false })
    }
  }

  const hasNeeds =
    state.serviceTypes.length > 0 || !!state.teamSize || state.modules.length > 0

  return (
    <div className="animate-fade-in-up">
      <h1 className="font-heading text-2xl font-bold text-[#1C1917]">
        Confirmez votre demande
      </h1>
      <p className="mt-2 text-sm text-[#57534E]">
        Vérifiez vos informations avant d&apos;envoyer.
      </p>

      <div className="mt-8 space-y-4">
        {/* Région */}
        <SummaryCard title="Région">
          <Row label="Plateforme" value={state.region?.platform_label ?? '—'} />
          <Row label="Pays" value={state.region?.country_name ?? '—'} />
          <Row label="Devise" value={state.region?.currency_symbol ?? '—'} />
        </SummaryCard>

        {/* Restaurant */}
        <SummaryCard title="Votre restaurant">
          <Row label="Responsable" value={`${state.firstName} ${state.lastName}`} />
          <Row label="Email" value={state.ownerEmail} />
          {state.phone && <Row label="Téléphone" value={state.phone} />}
          <Row label="Restaurant" value={state.restaurantName} />
          {state.city && <Row label="Ville" value={state.city} />}
          {state.message && <Row label="Message" value={state.message} />}
        </SummaryCard>

        {/* Besoins (optionnel) */}
        {hasNeeds && (
          <SummaryCard title="Vos besoins">
            {state.serviceTypes.length > 0 && (
              <Row
                label="Services"
                value={state.serviceTypes.map((s) => SERVICE_LABELS[s] ?? s).join(' · ')}
              />
            )}
            {state.teamSize && (
              <Row label="Équipe" value={TEAM_LABELS[state.teamSize] ?? state.teamSize} />
            )}
            {state.modules.length > 0 && (
              <Row
                label="Modules"
                value={state.modules.map((m) => MODULE_LABELS[m] ?? m).join(' · ')}
              />
            )}
          </SummaryCard>
        )}
      </div>

      {/* CGU */}
      <label className="mt-6 flex cursor-pointer items-start gap-3">
        <div className="relative mt-0.5 shrink-0">
          <input
            type="checkbox"
            className="sr-only"
            checked={cguAccepted}
            onChange={(e) => setCguAccepted(e.target.checked)}
          />
          <div
            className={[
              'flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200',
              cguAccepted
                ? 'border-[#C8553D] bg-[#C8553D]'
                : 'border-[#E7E5E4] bg-white',
            ].join(' ')}
          >
            {cguAccepted && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path
                  d="M2 5l2 2 4-4"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm text-[#57534E]">
          J&apos;accepte les{' '}
          <span className="cursor-pointer text-[#C8553D] underline">
            conditions générales d&apos;utilisation
          </span>{' '}
          et la{' '}
          <span className="cursor-pointer text-[#C8553D] underline">
            politique de confidentialité
          </span>
        </span>
      </label>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={state.isSubmitting}
          className="flex-1 rounded-lg border-2 border-[#E7E5E4] px-4 py-3 text-sm font-medium text-[#57534E] transition-colors hover:bg-[#F5F4F2] disabled:opacity-50"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!cguAccepted || state.isSubmitting}
          className={[
            'flex-[2] rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all duration-200',
            !cguAccepted || state.isSubmitting
              ? 'cursor-not-allowed bg-[#C8553D]/40'
              : 'bg-[#C8553D] hover:bg-[#A33D28]',
          ].join(' ')}
        >
          {state.isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Envoi en cours…
            </span>
          ) : (
            'Envoyer ma demande'
          )}
        </button>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-[#E7E5E4] bg-white p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#57534E]">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-sm text-[#57534E]">{label}</span>
      <span className="text-right text-sm font-medium text-[#1C1917]">{value}</span>
    </div>
  )
}
