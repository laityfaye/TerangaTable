'use client'

import { type SelectHTMLAttributes, forwardRef, useId } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:    string
  error?:    string
  hint?:     string
  required?: boolean
  options?:  SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      hint,
      required,
      disabled,
      options = [],
      placeholder,
      id: idProp,
      children,
      ...props
    },
    ref,
  ) => {
    const autoId = useId()
    const id = idProp ?? autoId
    const hintId = `${id}-hint`
    const errorId = `${id}-error`

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="font-body text-[13px] font-medium text-slate-700 leading-none"
          >
            {label}
            {required && (
              <span className="ml-1 text-red-500" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            aria-required={required || undefined}
            className={cn(
              'h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-9 text-sm text-slate-900',
              'transition-all duration-200',
              'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400/25',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-400/25',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>

          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1 text-xs text-red-500"
          >
            <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="text-xs text-slate-400">
            {hint}
          </p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
