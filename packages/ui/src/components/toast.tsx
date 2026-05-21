'use client'

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner'
import { cn } from '../lib/utils'

export interface ToasterProps {
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'
  richColors?: boolean
  closeButton?: boolean
}

export function Toaster({
  position    = 'top-right',
  richColors  = false,
  closeButton = true,
}: ToasterProps) {
  return (
    <SonnerToaster
      position={position}
      closeButton={closeButton}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            'font-body !bg-white !border !border-slate-200 !shadow-md !rounded-xl !text-slate-900 flex items-start gap-3',
          title:       '!text-sm !font-semibold !text-slate-900',
          description: '!text-sm !text-slate-500',
          closeButton:
            '!bg-white !border-slate-200 !text-slate-400 hover:!text-slate-600',
          success: '!border-emerald-200 [&_[data-icon]]:!text-emerald-500',
          error:   '!border-red-200   [&_[data-icon]]:!text-red-500',
          warning: '!border-amber-200 [&_[data-icon]]:!text-amber-500',
          info:    '!border-blue-200  [&_[data-icon]]:!text-blue-500',
        },
      }}
    />
  )
}

export const toast = {
  success: (message: string, options?: Parameters<typeof sonnerToast.success>[1]) =>
    sonnerToast.success(message, options),

  error: (message: string, options?: Parameters<typeof sonnerToast.error>[1]) =>
    sonnerToast.error(message, options),

  warning: (message: string, options?: Parameters<typeof sonnerToast.warning>[1]) =>
    sonnerToast.warning(message, options),

  info: (message: string, options?: Parameters<typeof sonnerToast.info>[1]) =>
    sonnerToast.info(message, options),

  loading: (message: string, options?: Parameters<typeof sonnerToast.loading>[1]) =>
    sonnerToast.loading(message, options),

  promise: <T,>(
    promise: Promise<T>,
    options: Parameters<typeof sonnerToast.promise<T>>[1],
  ) => sonnerToast.promise(promise, options),

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
}
