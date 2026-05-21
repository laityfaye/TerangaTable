'use client'

import {
  type ReactNode,
  type HTMLAttributes,
  type KeyboardEvent,
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  forwardRef,
} from 'react'
import { cn } from '../lib/utils'

/* ── Context ── */
interface DropdownContextValue {
  open:     boolean
  setOpen:  (v: boolean) => void
}
const DropdownContext = createContext<DropdownContextValue | null>(null)

function useDropdown() {
  const ctx = useContext(DropdownContext)
  if (!ctx) throw new Error('DropdownMenu components must be used within <DropdownMenu>')
  return ctx
}

/* ── Root ── */
export function DropdownMenu({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className={cn('relative inline-block', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

/* ── Trigger ── */
export function DropdownTrigger({
  children,
  asChild = false,
}: {
  children: ReactNode
  asChild?: boolean
}) {
  const { open, setOpen } = useDropdown()

  if (asChild) {
    return (
      <span
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="cursor-pointer"
      >
        {children}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      aria-haspopup="menu"
      className="inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-lg"
    >
      {children}
    </button>
  )
}

/* ── Content ── */
export function DropdownContent({
  children,
  align = 'start',
  className,
}: {
  children:   ReactNode
  align?:     'start' | 'end'
  className?: string
}) {
  const { open } = useDropdown()

  return (
    <div
      role="menu"
      aria-hidden={!open}
      className={cn(
        'absolute z-10 mt-1.5 min-w-[10rem] rounded-xl bg-white py-1.5 shadow-md border border-slate-200',
        'transition-all duration-150 origin-top',
        align === 'end' ? 'right-0' : 'left-0',
        open
          ? 'opacity-100 scale-100 pointer-events-auto'
          : 'opacity-0 scale-95 pointer-events-none',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ── Item ── */
export interface DropdownItemProps extends HTMLAttributes<HTMLButtonElement> {
  icon?:       ReactNode
  destructive?: boolean
  disabled?:   boolean
}

export const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ children, icon, destructive, disabled, className, onClick, ...props }, ref) => {
    const { setOpen } = useDropdown()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      setOpen(false)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick(e as unknown as React.MouseEvent<HTMLButtonElement>)
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex w-full items-center gap-2.5 px-3.5 py-2 text-sm transition-colors',
          'hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none',
          'disabled:pointer-events-none disabled:opacity-40',
          destructive ? 'text-red-600 hover:bg-red-50' : 'text-slate-700',
          className,
        )}
        {...props}
      >
        {icon && (
          <span className="h-4 w-4 shrink-0 text-current opacity-60" aria-hidden="true">
            {icon}
          </span>
        )}
        {children}
      </button>
    )
  },
)
DropdownItem.displayName = 'DropdownItem'

/* ── Separator ── */
export function DropdownSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cn('my-1 h-px bg-slate-100', className)} />
}
