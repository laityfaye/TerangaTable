'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { WizardState, WizardAction } from '../page'

const schema = z.object({
  firstName: z.string().min(2, 'Prénom requis (min. 2 caractères)'),
  lastName: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  ownerEmail: z.string().email('Adresse email invalide'),
  phone: z.string().min(8, 'Numéro de téléphone invalide'),
  restaurantName: z.string().min(2, 'Nom du restaurant requis (min. 2 caractères)'),
  city: z.string().optional(),
  message: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function Step2Info({
  state,
  dispatch,
  onNext,
  onBack,
}: {
  state: WizardState
  dispatch: React.Dispatch<WizardAction>
  onNext: () => void
  onBack: () => void
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: state.firstName,
      lastName: state.lastName,
      ownerEmail: state.ownerEmail,
      phone: state.phone,
      restaurantName: state.restaurantName,
      city: state.city,
      message: state.message,
    },
  })

  useEffect(() => {
    if (state.region?.phone_prefix && !state.phone) {
      setValue('phone', state.region.phone_prefix + ' ')
    }
  }, [state.region?.phone_prefix, state.phone, setValue])

  const onSubmit = (data: FormData) => {
    dispatch({ type: 'SET_FIELD', field: 'firstName', value: data.firstName })
    dispatch({ type: 'SET_FIELD', field: 'lastName', value: data.lastName })
    dispatch({ type: 'SET_FIELD', field: 'ownerEmail', value: data.ownerEmail })
    dispatch({ type: 'SET_FIELD', field: 'phone', value: data.phone })
    dispatch({ type: 'SET_FIELD', field: 'restaurantName', value: data.restaurantName })
    dispatch({ type: 'SET_FIELD', field: 'city', value: data.city ?? '' })
    dispatch({ type: 'SET_FIELD', field: 'message', value: data.message ?? '' })
    onNext()
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="font-heading text-2xl font-bold text-[#1C1917]">
        Informations du restaurant
      </h1>
      {state.region && (
        <p className="mt-2 text-sm font-medium text-[#C8553D]">
          ✨ Votre restaurant rejoindra {state.region.platform_label}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        {/* Prénom / Nom */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Prénom" error={errors.firstName?.message} required>
            <input
              {...register('firstName')}
              placeholder="Mamadou"
              autoComplete="given-name"
              className={inputCls(!!errors.firstName)}
            />
          </Field>
          <Field label="Nom" error={errors.lastName?.message} required>
            <input
              {...register('lastName')}
              placeholder="Diallo"
              autoComplete="family-name"
              className={inputCls(!!errors.lastName)}
            />
          </Field>
        </div>

        <Field label="Email professionnel" error={errors.ownerEmail?.message} required>
          <input
            {...register('ownerEmail')}
            type="email"
            placeholder="mamadou@restaurant.sn"
            autoComplete="email"
            className={inputCls(!!errors.ownerEmail)}
          />
        </Field>

        <Field label="Téléphone" error={errors.phone?.message} required>
          <input
            {...register('phone')}
            type="tel"
            placeholder={`${state.region?.phone_prefix ?? '+221'} 77 000 00 00`}
            autoComplete="tel"
            className={inputCls(!!errors.phone)}
          />
          {state.region && (
            <p className="mt-1.5 text-xs text-[#57534E]">
              Indicatif {state.region.country_name} : {state.region.phone_prefix}
            </p>
          )}
        </Field>

        <Field label="Nom du restaurant" error={errors.restaurantName?.message} required>
          <input
            {...register('restaurantName')}
            placeholder="Restaurant Le Baobab"
            autoComplete="organization"
            className={inputCls(!!errors.restaurantName)}
          />
        </Field>

        <Field label="Ville" error={errors.city?.message}>
          <input
            {...register('city')}
            placeholder={state.region?.name ?? 'Votre ville'}
            className={inputCls(false)}
          />
        </Field>

        <Field label="Parlez-nous de votre restaurant" error={errors.message?.message}>
          <textarea
            {...register('message')}
            rows={3}
            placeholder="Cuisine sénégalaise traditionnelle, ouvert depuis 2018…"
            className={inputCls(false) + ' resize-none'}
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-lg border-2 border-[#E7E5E4] px-4 py-3 text-sm font-medium text-[#57534E] transition-colors hover:bg-[#F5F4F2]"
          >
            Retour
          </button>
          <button
            type="submit"
            className="flex-[2] rounded-lg bg-[#C8553D] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#A33D28]"
          >
            Continuer →
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string | undefined
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#1C1917]">
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return [
    'w-full rounded-lg border px-3.5 py-3 text-sm text-[#1C1917] outline-none transition-all duration-200',
    'placeholder:text-[#A8A29E]',
    hasError
      ? 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
      : 'border-[#E7E5E4] focus:border-[#C8553D] focus:shadow-[0_0_0_3px_rgba(200,85,61,0.15)]',
  ].join(' ')
}
