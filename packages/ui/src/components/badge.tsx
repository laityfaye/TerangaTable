import { type HTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border',
  {
    variants: {
      variant: {
        default:   'bg-slate-100    text-slate-700  border-slate-200',
        pending:   'bg-amber-50     text-amber-700  border-amber-200',
        approved:  'bg-emerald-50   text-emerald-700 border-emerald-200',
        rejected:  'bg-red-50       text-red-700    border-red-200',
        active:    'bg-green-50     text-green-700  border-green-200',
        suspended: 'bg-slate-100    text-slate-600  border-slate-200',
        trial:     'bg-blue-50      text-blue-700   border-blue-200',
        new:       'bg-brand-50     text-brand-600  border-brand-200',
        info:      'bg-blue-50      text-blue-700   border-blue-200',
        warning:   'bg-amber-50     text-amber-700  border-amber-200',
        success:   'bg-emerald-50   text-emerald-700 border-emerald-200',
        danger:    'bg-red-50       text-red-700    border-red-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  children: ReactNode
  dot?: boolean
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, dot, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  ),
)
Badge.displayName = 'Badge'

export { badgeVariants }

/** Composant spécialisé pour les statuts de commandes workflow */
export interface BadgeOrderStatusProps extends HTMLAttributes<HTMLSpanElement> {
  color: string
  label: string
}

export function BadgeOrderStatus({ color, label, className, ...props }: BadgeOrderStatusProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border',
        className,
      )}
      style={{
        backgroundColor: `${color}20`,
        borderColor:     `${color}40`,
        color,
      }}
      {...props}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
