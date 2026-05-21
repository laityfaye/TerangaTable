import { type ReactNode } from 'react'
import { cn } from '../lib/utils'

export interface SectionHeaderProps {
  title:        string
  description?: string
  actions?:     ReactNode
  divider?:     boolean
  className?:   string
}

export function SectionHeader({
  title,
  description,
  actions,
  divider = true,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 leading-tight">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {divider && <hr className="border-slate-100" />}
    </div>
  )
}
