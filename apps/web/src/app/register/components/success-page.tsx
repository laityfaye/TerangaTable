'use client'

import type { WizardState } from '../page'

export default function SuccessPage({ state }: { state: WizardState }) {
  const rawId = state.submittedId ?? 'demo'
  const shortId = rawId.length >= 8
    ? rawId.slice(-8).toUpperCase()
    : rawId.toUpperCase()
  const reqNumber = `REQ-2026-${shortId}`

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <ConfettiRain />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
        <div className="animate-fade-in-up max-w-md w-full">
          {/* Illustration */}
          <RestaurantIllustration />

          <h1 className="mt-6 font-heading text-3xl font-bold text-[#1C1917]">
            🎉 Demande envoyée avec succès !
          </h1>

          {/* Tracking badge */}
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#E7E5E4] bg-[#F5F4F2] px-4 py-2">
            <span className="text-sm text-[#57534E]">Numéro de suivi</span>
            <span className="font-mono text-sm font-bold text-[#C8553D]">{reqNumber}</span>
          </div>

          <p className="mt-6 text-base text-[#57534E]">
            L&apos;équipe{' '}
            <strong className="text-[#1C1917]">
              {state.region?.platform_label ?? 'TérangaTable'}
            </strong>{' '}
            vous répondra sous{' '}
            <strong className="text-[#1C1917]">24h</strong>.
          </p>

          <p className="mt-2 text-sm text-[#57534E]">
            Un email de confirmation a été envoyé à{' '}
            <strong className="text-[#1C1917]">{state.ownerEmail}</strong>
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="/"
              className="rounded-lg border-2 border-[#E7E5E4] px-6 py-3 text-sm font-medium text-[#57534E] transition-colors hover:bg-[#F5F4F2]"
            >
              Retour à l&apos;accueil
            </a>
            <a
              href="/login"
              className="rounded-lg bg-[#C8553D] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#A33D28]"
            >
              Déjà client ? Se connecter
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-40px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(600deg); opacity: 0; }
        }
        @keyframes confetti-sway {
          0%, 100% { margin-left: 0; }
          50%       { margin-left: 24px; }
        }
      `}</style>
    </div>
  )
}

const CONFETTI_COLORS = ['#C8553D', '#D4A843', '#2D6A4F', '#3B82F6', '#F59E0B', '#E8826F']

function ConfettiRain() {
  const pieces = Array.from({ length: 36 }, (_, i) => {
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    const left = `${(i / 36) * 100 + Math.sin(i) * 4}%`
    const delay = `${(i * 0.12).toFixed(2)}s`
    const duration = `${(2.8 + (i % 5) * 0.4).toFixed(1)}s`
    const size = i % 3 === 0 ? 10 : 7
    const shape =
      i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0'
    return { color, left, delay, duration, size, shape }
  })

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      {pieces.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '-20px',
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape,
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards,
                        confetti-sway ${p.duration} ${p.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  )
}

function RestaurantIllustration() {
  return (
    <svg
      width="180"
      height="150"
      viewBox="0 0 180 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="mx-auto"
    >
      {/* Building body */}
      <rect x="25" y="60" width="130" height="80" rx="4" fill="#FDF2EF" stroke="#C8553D" strokeWidth="2" />
      {/* Roof */}
      <path d="M18 63 L90 18 L162 63Z" fill="#C8553D" />
      {/* Roof shadow */}
      <path d="M18 63 L90 18 L162 63Z" fill="url(#roofGrad)" />
      {/* Door */}
      <rect x="68" y="95" width="44" height="45" rx="4" fill="#A33D28" />
      <circle cx="109" cy="117" r="3.5" fill="#D4A843" />
      {/* Left window */}
      <rect x="36" y="75" width="32" height="22" rx="3" fill="#D4A843" fillOpacity="0.35" stroke="#D4A843" strokeWidth="1.5" />
      <line x1="52" y1="75" x2="52" y2="97" stroke="#D4A843" strokeWidth="1" />
      <line x1="36" y1="86" x2="68" y2="86" stroke="#D4A843" strokeWidth="1" />
      {/* Right window */}
      <rect x="112" y="75" width="32" height="22" rx="3" fill="#D4A843" fillOpacity="0.35" stroke="#D4A843" strokeWidth="1.5" />
      <line x1="128" y1="75" x2="128" y2="97" stroke="#D4A843" strokeWidth="1" />
      <line x1="112" y1="86" x2="144" y2="86" stroke="#D4A843" strokeWidth="1" />
      {/* Sign */}
      <rect x="58" y="47" width="64" height="17" rx="3" fill="#D4A843" />
      <text x="90" y="60" textAnchor="middle" fill="white" fontSize="8" fontFamily="DM Sans,sans-serif" fontWeight="700">
        RESTAURANT
      </text>
      {/* Accent stars */}
      <text x="155" y="35" fontSize="18">⭐</text>
      <text x="8" y="50" fontSize="14">✨</text>
      <text x="158" y="145" fontSize="12">🌿</text>
      {/* Ground */}
      <rect x="0" y="140" width="180" height="10" rx="2" fill="#F5F4F2" />
      <defs>
        <linearGradient id="roofGrad" x1="90" y1="18" x2="90" y2="63" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A33D28" stopOpacity="0" />
          <stop offset="1" stopColor="#A33D28" stopOpacity="0.15" />
        </linearGradient>
      </defs>
    </svg>
  )
}
