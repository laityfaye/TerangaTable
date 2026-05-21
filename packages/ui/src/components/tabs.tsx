'use client'

import { type ReactNode, useState, createContext, useContext } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

/* ── Context ── */
interface TabsContextValue {
  active:     string
  setActive:  (v: string) => void
  variant:    'underline' | 'pills'
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs components must be used within <Tabs>')
  return ctx
}

/* ── Root ── */
const tabsVariants = cva('', {
  variants: {
    variant: {
      underline: 'border-b border-slate-200',
      pills:     'bg-slate-100 p-1 rounded-xl inline-flex',
    },
  },
  defaultVariants: { variant: 'underline' },
})

export interface TabsProps extends VariantProps<typeof tabsVariants> {
  defaultValue: string
  value?:       string
  onValueChange?: (value: string) => void
  children:     ReactNode
  className?:   string
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  variant = 'underline',
  children,
  className,
}: TabsProps) {
  const [internalActive, setInternalActive] = useState(defaultValue)
  const active    = value ?? internalActive
  const setActive = (v: string) => {
    setInternalActive(v)
    onValueChange?.(v)
  }

  return (
    <TabsContext.Provider value={{ active, setActive, variant: variant ?? 'underline' }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

/* ── List ── */
export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  const { variant } = useTabsContext()
  return (
    <div
      role="tablist"
      className={cn(tabsVariants({ variant }), variant === 'underline' ? 'flex gap-0' : 'flex gap-1', className)}
    >
      {children}
    </div>
  )
}

/* ── Trigger ── */
export interface TabsTriggerProps {
  value:      string
  children:   ReactNode
  className?: string
  disabled?:  boolean
}

export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const { active, setActive, variant } = useTabsContext()
  const isActive = active === value

  const underlineClasses = cn(
    'relative px-4 py-2.5 text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1',
    'disabled:pointer-events-none disabled:opacity-40',
    isActive
      ? 'text-brand-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-500'
      : 'text-slate-500 hover:text-slate-700',
  )

  const pillsClasses = cn(
    'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
    'disabled:pointer-events-none disabled:opacity-40',
    isActive
      ? 'bg-brand-500 text-white shadow-sm'
      : 'text-slate-600 hover:text-slate-900',
  )

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActive(value)}
      className={cn(variant === 'underline' ? underlineClasses : pillsClasses, className)}
    >
      {children}
    </button>
  )
}

/* ── Content ── */
export interface TabsContentProps {
  value:      string
  children:   ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { active } = useTabsContext()
  if (active !== value) return null
  return (
    <div role="tabpanel" className={cn('mt-4', className)}>
      {children}
    </div>
  )
}
