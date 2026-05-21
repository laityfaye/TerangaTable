'use client'

import {
  type ReactNode,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const panelVariants = cva(
  'relative bg-white rounded-2xl shadow-2xl w-full mx-4 flex flex-col max-h-[90vh]',
  {
    variants: {
      size: {
        sm:   'max-w-sm',
        md:   'max-w-md',
        lg:   'max-w-lg',
        xl:   'max-w-xl',
        full: 'max-w-full mx-0 rounded-none h-screen max-h-screen',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export interface ModalProps extends VariantProps<typeof panelVariants> {
  open:         boolean
  onClose:      () => void
  title?:       string
  description?: string
  children:     ReactNode
  className?:   string
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size,
  children,
  className,
}: ModalProps) {
  const [mounted, setMounted]   = useState(false)
  const [visible, setVisible]   = useState(false)
  const [animate, setAnimate]   = useState(false)
  const panelRef                = useRef<HTMLDivElement>(null)
  const closeBtnRef             = useRef<HTMLButtonElement>(null)

  // SSR guard
  useEffect(() => setMounted(true), [])

  // Sync open → visible/animate
  useEffect(() => {
    if (open) {
      setVisible(true)
      requestAnimationFrame(() => setAnimate(true))
    } else {
      setAnimate(false)
      const t = setTimeout(() => setVisible(false), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  // Focus first focusable element when opening
  useEffect(() => {
    if (animate && panelRef.current) {
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusable[0]?.focus()
    }
  }, [animate])

  // Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Focus trap
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last  = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last?.focus() }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first?.focus() }
    }
  }, [])

  if (!mounted || !visible) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-40 flex items-center justify-center',
        'transition-opacity duration-200',
        animate ? 'opacity-100' : 'opacity-0',
      )}
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-desc' : undefined}
        onKeyDown={handleKeyDown}
        className={cn(
          panelVariants({ size }),
          'transition-transform duration-200',
          animate ? 'scale-100' : 'scale-95',
          className,
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="font-display text-lg font-semibold text-slate-900"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-desc" className="mt-0.5 text-sm text-slate-500">
                  {description}
                </p>
              )}
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
