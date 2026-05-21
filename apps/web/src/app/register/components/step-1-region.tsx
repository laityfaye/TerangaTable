'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import type { Region, WizardState } from '../page'

const FLAGS: Record<string, string> = {
  SN: '🇸🇳',
  CI: '🇨🇮',
  MA: '🇲🇦',
  FR: '🇫🇷',
}

const STATIC_REGIONS: Region[] = [
  {
    id: 'dakar',
    name: 'Dakar',
    slug: 'dakar',
    country_code: 'SN',
    country_name: 'Sénégal',
    platform_label: 'TérangaTable Dakar',
    currency_code: 'XOF',
    currency_symbol: 'F CFA',
    phone_prefix: '+221',
    is_active: true,
  },
  {
    id: 'thies',
    name: 'Thiès',
    slug: 'thies',
    country_code: 'SN',
    country_name: 'Sénégal',
    platform_label: 'TérangaTable Thiès',
    currency_code: 'XOF',
    currency_symbol: 'F CFA',
    phone_prefix: '+221',
    is_active: true,
  },
  {
    id: 'saint-louis',
    name: 'Saint-Louis',
    slug: 'saint-louis',
    country_code: 'SN',
    country_name: 'Sénégal',
    platform_label: 'TérangaTable Saint-Louis',
    currency_code: 'XOF',
    currency_symbol: 'F CFA',
    phone_prefix: '+221',
    is_active: true,
  },
  {
    id: 'abidjan',
    name: 'Abidjan',
    slug: 'abidjan',
    country_code: 'CI',
    country_name: "Côte d'Ivoire",
    platform_label: 'TérangaTable Abidjan',
    currency_code: 'XOF',
    currency_symbol: 'F CFA',
    phone_prefix: '+225',
    is_active: true,
  },
  {
    id: 'casablanca',
    name: 'Casablanca',
    slug: 'casablanca',
    country_code: 'MA',
    country_name: 'Maroc',
    platform_label: 'TérangaTable Casablanca',
    currency_code: 'MAD',
    currency_symbol: 'DH',
    phone_prefix: '+212',
    is_active: true,
  },
  {
    id: 'paris',
    name: 'Paris',
    slug: 'paris',
    country_code: 'FR',
    country_name: 'France',
    platform_label: 'TérangaTable Paris',
    currency_code: 'EUR',
    currency_symbol: '€',
    phone_prefix: '+33',
    is_active: false,
  },
]

export default function Step1Region({
  state,
  onSelect,
}: {
  state: WizardState
  onSelect: (region: Region) => void
}) {
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient
      .get('/regions')
      .then((res) => {
        const data = res.data?.data ?? res.data
        setRegions(Array.isArray(data) && data.length > 0 ? data : STATIC_REGIONS)
      })
      .catch(() => setRegions(STATIC_REGIONS))
      .finally(() => setLoading(false))
  }, [])

  const grouped = regions.reduce<Record<string, Region[]>>((acc, r) => {
    ;(acc[r.country_name] ??= []).push(r)
    return acc
  }, {})

  return (
    <div className="animate-fade-in-up">
      {/* Decorative Africa map */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-40 -translate-x-1/2"
      >
        <AfricaSVG />
      </div>

      <div className="relative">
        <h1 className="font-heading text-2xl font-bold text-[#1C1917]">
          Choisissez votre région
        </h1>
        <p className="mt-2 text-sm text-[#57534E]">
          TérangaTable est présent dans plusieurs villes. Sélectionnez la région de votre restaurant.
        </p>

        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg bg-[#F5F4F2]"
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {Object.entries(grouped).map(([country, countryRegions]) => {
              const code = countryRegions[0]?.country_code ?? ''
              return (
                <div key={country}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-lg" aria-hidden>{FLAGS[code] ?? '🌍'}</span>
                    <span className="text-sm font-semibold text-[#57534E]">{country}</span>
                    <div className="flex-1 border-t border-[#E7E5E4]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {countryRegions.map((region) => (
                      <RegionCard
                        key={region.id}
                        region={region}
                        selected={state.region?.id === region.id}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function RegionCard({
  region,
  selected,
  onSelect,
}: {
  region: Region
  selected: boolean
  onSelect: (r: Region) => void
}) {
  const flag = FLAGS[region.country_code] ?? '🌍'
  const disabled = !region.is_active

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(region)}
      aria-pressed={selected}
      className={[
        'relative flex flex-col rounded-lg border-2 p-3 text-left transition-all duration-200',
        disabled
          ? 'cursor-not-allowed opacity-40'
          : selected
          ? 'border-[#C8553D] bg-[#FDF2EF] shadow-[0_0_0_3px_rgba(200,85,61,0.15)]'
          : 'border-[#E7E5E4] bg-white hover:-translate-y-0.5 hover:shadow-md',
      ].join(' ')}
    >
      {disabled && (
        <span className="absolute right-2 top-2 rounded-full bg-[#F5F4F2] px-2 py-0.5 text-[10px] font-medium text-[#57534E]">
          Bientôt
        </span>
      )}
      {selected && (
        <span
          aria-hidden
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#C8553D]"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5l2 2 4-4"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
      <span className="text-2xl" aria-hidden>{flag}</span>
      <span className="mt-2 text-sm font-semibold leading-tight text-[#1C1917]">
        {region.platform_label}
      </span>
      <span className="mt-0.5 text-xs text-[#57534E]">{region.name}</span>
      <span className="mt-1 text-xs text-[#57534E]">{region.currency_symbol}</span>
      {region.tenant_count !== undefined && (
        <span className="mt-0.5 text-[11px] text-[#C8553D]">
          {region.tenant_count} restaurant{region.tenant_count > 1 ? 's' : ''}
        </span>
      )}
    </button>
  )
}

function AfricaSVG() {
  return (
    <svg
      width="520"
      height="520"
      viewBox="0 0 200 220"
      fill="none"
      className="opacity-[0.035]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M78 8 C58 8 38 18 27 40 C16 62 12 88 18 114 C24 140 36 160 48 176 C60 192 66 208 78 220 C90 232 106 238 120 232 C134 226 140 210 152 194 C164 178 172 156 175 134 C178 112 174 90 164 72 C154 54 148 44 152 28 C156 12 148 4 136 4 C124 0 98 8 78 8Z"
        fill="#C8553D"
      />
    </svg>
  )
}
