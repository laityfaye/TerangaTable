import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '../lib/utils'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?:  string | number
  height?: string | number
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ width, height, style, className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-slate-100', className)}
      style={{ width, height, ...style }}
      {...props}
    />
  ),
)
Skeleton.displayName = 'Skeleton'

export interface SkeletonTextProps {
  lines?:     number
  className?: string
  lastWidth?: string
}

export function SkeletonText({ lines = 3, className, lastWidth = '60%' }: SkeletonTextProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          style={{ width: i === lines - 1 && lines > 1 ? lastWidth : '100%' }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-2xl bg-white p-6 shadow-card', className)}
      aria-hidden="true"
    >
      <Skeleton height={20} width="50%" className="mb-4" />
      <SkeletonText lines={3} />
    </div>
  )
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div className={cn('w-full', className)} aria-hidden="true">
      {/* Header */}
      <div className="flex gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={12} className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 border-b border-slate-100 px-4 py-3"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              height={14}
              className="flex-1"
              style={{ opacity: 1 - r * 0.12 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
