'use client'

import type { WizardState, WizardAction } from '../page'

const SERVICE_TYPES = [
  { id: 'dine_in', emoji: '🍽️', label: 'Sur place' },
  { id: 'takeaway', emoji: '🥡', label: 'À emporter' },
  { id: 'delivery', emoji: '🛵', label: 'Livraison' },
  { id: 'online', emoji: '📱', label: 'Commande en ligne' },
]

const TEAM_SIZES = [
  { id: 'solo', emoji: '👤', label: 'Je suis seul' },
  { id: '2-5', emoji: '👥', label: '2–5 personnes' },
  { id: '6-15', emoji: '👨‍👩‍👧‍👦', label: '6–15 personnes' },
  { id: '16+', emoji: '🏢', label: '16 et plus' },
]

const MODULES = [
  { id: 'website', emoji: '📱', label: 'Site vitrine', desc: 'Page web publique' },
  { id: 'pos', emoji: '🏧', label: 'Caisse POS', desc: 'Encaissement rapide' },
  { id: 'reservations', emoji: '📅', label: 'Réservations', desc: 'Gestion des tables' },
  { id: 'delivery', emoji: '🚀', label: 'Livraison', desc: 'Zones & livreurs' },
  { id: 'crm', emoji: '👥', label: 'CRM Clients', desc: 'Fidélité & historique' },
  { id: 'analytics', emoji: '📊', label: 'Analytics', desc: 'Rapports & stats' },
]

export default function Step3Needs({
  state,
  dispatch,
  onNext,
  onBack,
}: {
  state: WizardState
  dispatch: React.Dispatch<WizardAction>
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div className="animate-fade-in-up">
      <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Vos besoins</h1>
      <p className="mt-2 text-sm text-[#57534E]">
        Aidez-nous à préparer votre espace. Vous pourrez tout modifier après l&apos;inscription.
      </p>

      {/* Type de service */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-[#1C1917]">Type de service</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SERVICE_TYPES.map((s) => (
            <ChoiceCard
              key={s.id}
              emoji={s.emoji}
              label={s.label}
              selected={state.serviceTypes.includes(s.id)}
              onClick={() =>
                dispatch({ type: 'TOGGLE_ARRAY', field: 'serviceTypes', value: s.id })
              }
            />
          ))}
        </div>
      </section>

      {/* Taille de l'équipe */}
      <section className="mt-7">
        <h2 className="mb-3 text-sm font-semibold text-[#1C1917]">
          Taille de l&apos;équipe
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TEAM_SIZES.map((t) => (
            <ChoiceCard
              key={t.id}
              emoji={t.emoji}
              label={t.label}
              selected={state.teamSize === t.id}
              onClick={() =>
                dispatch({ type: 'SET_FIELD', field: 'teamSize', value: t.id })
              }
            />
          ))}
        </div>
      </section>

      {/* Modules souhaités */}
      <section className="mt-7">
        <h2 className="mb-3 text-sm font-semibold text-[#1C1917]">Modules souhaités</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MODULES.map((m) => (
            <ModuleCard
              key={m.id}
              emoji={m.emoji}
              label={m.label}
              desc={m.desc}
              selected={state.modules.includes(m.id)}
              onClick={() =>
                dispatch({ type: 'TOGGLE_ARRAY', field: 'modules', value: m.id })
              }
            />
          ))}
        </div>
      </section>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border-2 border-[#E7E5E4] px-4 py-3 text-sm font-medium text-[#57534E] transition-colors hover:bg-[#F5F4F2]"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-[2] rounded-lg bg-[#C8553D] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#A33D28]"
        >
          Continuer →
        </button>
      </div>
    </div>
  )
}

function ChoiceCard({
  emoji,
  label,
  selected,
  onClick,
}: {
  emoji: string
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all duration-200',
        selected
          ? 'border-[#C8553D] bg-[#FDF2EF] shadow-[0_0_0_3px_rgba(200,85,61,0.15)]'
          : 'border-[#E7E5E4] bg-white hover:-translate-y-0.5 hover:shadow-md',
      ].join(' ')}
    >
      {selected && (
        <span
          aria-hidden
          className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#C8553D]"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path
              d="M1.5 4l1.5 1.5L6.5 2"
              stroke="white"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
      <span className="text-3xl" aria-hidden>
        {emoji}
      </span>
      <span className="text-xs font-medium leading-tight text-[#1C1917]">{label}</span>
    </button>
  )
}

function ModuleCard({
  emoji,
  label,
  desc,
  selected,
  onClick,
}: {
  emoji: string
  label: string
  desc: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'relative flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-all duration-200',
        selected
          ? 'border-[#C8553D] bg-[#FDF2EF] shadow-[0_0_0_3px_rgba(200,85,61,0.15)]'
          : 'border-[#E7E5E4] bg-white hover:-translate-y-0.5 hover:shadow-md',
      ].join(' ')}
    >
      {selected && (
        <span
          aria-hidden
          className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#C8553D]"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path
              d="M1.5 4l1.5 1.5L6.5 2"
              stroke="white"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <span className="text-sm font-semibold text-[#1C1917]">{label}</span>
      <span className="text-[11px] leading-tight text-[#57534E]">{desc}</span>
    </button>
  )
}
