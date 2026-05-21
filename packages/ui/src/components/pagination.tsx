'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

export interface PaginationProps {
  page:         number
  pageSize:     number
  total:        number
  onPageChange: (page: number) => void
  className?:   string
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3 text-sm text-slate-500',
        className,
      )}
      aria-label="Pagination"
    >
      <span className="shrink-0">
        {total === 0 ? 'Aucun résultat' : `${from}–${to} sur ${total}`}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Page précédente"
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            'hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
          )}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <span className="min-w-[3rem] text-center text-sm font-medium text-slate-700">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Page suivante"
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            'hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
          )}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
