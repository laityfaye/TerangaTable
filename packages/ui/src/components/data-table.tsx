'use client'

import { type ReactNode, useState } from 'react'
import { cn } from '../lib/utils'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './table'
import { SkeletonTable } from './skeleton'
import { EmptyState } from './empty-state'
import { Pagination } from './pagination'

export interface ColumnDef<T> {
  key:        string
  header:     string
  cell?:      (row: T, index: number) => ReactNode
  className?: string
}

export interface DataTableProps<T> {
  data:        T[]
  columns:     ColumnDef<T>[]
  loading?:    boolean
  empty?:      ReactNode
  getRowKey?:  (row: T, index: number) => string | number
  compact?:    boolean
  className?:  string
  pagination?: {
    page:         number
    pageSize:     number
    total:        number
    onPageChange: (page: number) => void
  }
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  empty,
  getRowKey,
  compact = false,
  className,
  pagination,
}: DataTableProps<T>) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <SkeletonTable rows={5} cols={columns.length} />
        ) : data.length === 0 ? (
          <div className="py-8">
            {empty ?? (
              <EmptyState
                size="table"
                title="Aucune donnée"
                description="Aucun enregistrement à afficher pour l'instant."
              />
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow
                  key={getRowKey ? getRowKey(row, i) : i}
                  compact={compact}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      compact={compact}
                      className={col.className}
                    >
                      {col.cell
                        ? col.cell(row, i)
                        : (row[col.key] as ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {pagination && !loading && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  )
}
