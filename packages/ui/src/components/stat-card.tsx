import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../lib/utils'

export interface StatCardProps {
  label:      string
  value:      string | number
  trend?:     number
  icon?:      ReactNode
  iconColor?: string
  prefix?:    string
  suffix?:    string
  className?: string
}

export function StatCard({
  label,
  value,
  trend,
  icon,
  iconColor = 'bg-brand-50 text-brand-500',
  prefix,
  suffix,
  className,
}: StatCardProps) {
  const hasTrend  = trend !== undefined && trend !== null
  const isUp      = hasTrend && trend! > 0
  const isDown    = hasTrend && trend! < 0
  const isNeutral = hasTrend && trend === 0

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-card',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && (
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              iconColor,
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <p className="font-display text-3xl font-bold text-slate-900 leading-none">
          {prefix && <span className="text-xl font-semibold text-slate-500 mr-0.5">{prefix}</span>}
          {value}
          {suffix && <span className="ml-1 text-xl font-semibold text-slate-500">{suffix}</span>}
        </p>

        {hasTrend && (
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              isUp      && 'bg-emerald-50 text-emerald-600',
              isDown    && 'bg-red-50 text-red-600',
              isNeutral && 'bg-slate-100 text-slate-500',
            )}
            aria-label={`Tendance : ${trend! > 0 ? '+' : ''}${trend}%`}
          >
            {isUp      && <TrendingUp   className="h-3 w-3" aria-hidden="true" />}
            {isDown    && <TrendingDown className="h-3 w-3" aria-hidden="true" />}
            {isNeutral && <Minus        className="h-3 w-3" aria-hidden="true" />}
            {trend! > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </div>
  )
}
