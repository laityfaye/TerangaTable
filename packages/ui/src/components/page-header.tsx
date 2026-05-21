import { type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title:        string
  description?: string
  breadcrumb?:  BreadcrumbItem[]
  actions?:     ReactNode
  className?:   string
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Fil d'Ariane">
          <ol className="flex items-center gap-1 text-xs text-slate-400">
            {breadcrumb.map((item, i) => {
              const isLast = i === breadcrumb.length - 1
              return (
                <li key={i} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                  )}
                  {isLast ? (
                    <span className="font-medium text-slate-600" aria-current="page">
                      {item.label}
                    </span>
                  ) : item.href ? (
                    <a
                      href={item.href}
                      className="hover:text-slate-600 transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-bold leading-tight text-slate-900">
            {title}
          </h1>
          {description && (
            <p className="mt-1 font-body text-[15px] text-slate-500">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}
