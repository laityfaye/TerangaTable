import { type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const emptyStateVariants = cva(
  'flex flex-col items-center justify-center text-center',
  {
    variants: {
      size: {
        page:  'py-20',
        card:  'py-12',
        table: 'py-8',
      },
    },
    defaultVariants: {
      size: 'card',
    },
  },
)

export interface EmptyStateProps extends VariantProps<typeof emptyStateVariants> {
  icon?:        ReactNode
  title:        string
  description?: string
  action?:      ReactNode
  className?:   string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(emptyStateVariants({ size }), className)}>
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center text-slate-300">
          {icon}
        </div>
      )}
      <p className="font-display text-base font-semibold text-slate-700">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-slate-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
