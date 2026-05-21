'use client'

import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        primary:   'bg-brand-500 text-white shadow-md hover:bg-brand-600 hover:shadow-lg',
        secondary: 'border-2 border-brand-500 text-brand-500 bg-transparent hover:bg-brand-50',
        ghost:     'text-slate-600 bg-transparent hover:bg-slate-100 hover:text-slate-900',
        danger:    'bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg',
        success:   'bg-emerald-600 text-white shadow-md hover:bg-emerald-700 hover:shadow-lg',
        link:      'text-brand-500 underline-offset-4 hover:underline h-auto px-0 shadow-none',
      },
      size: {
        sm: 'h-8  px-3   text-xs  rounded-md',
        md: 'h-10 px-4   text-sm  rounded-lg',
        lg: 'h-11 px-5   text-sm  rounded-lg',
        xl: 'h-14 px-8   text-base font-semibold rounded-xl',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size:    'md',
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?:   boolean
  leftIcon?:  ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">{rightIcon}</span>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { buttonVariants }
