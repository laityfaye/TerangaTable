'use client'

import { type TextareaHTMLAttributes, forwardRef, useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:    string
  error?:    string
  hint?:     string
  required?: boolean
  rows?:     number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      required,
      disabled,
      id: idProp,
      rows = 4,
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

        <textarea
          ref={ref}
          id={id}
          rows={rows}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          aria-required={required || undefined}
          className={cn(
            'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900',
            'placeholder:text-slate-400',
            'transition-all duration-200 resize-y',
            'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400/25',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-400/25',
            className,
          )}
          {...props}
        />

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

Textarea.displayName = 'Textarea'
