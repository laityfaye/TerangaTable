'use client'

import { useReducer, useEffect } from 'react'
import WizardProgress from './components/wizard-progress'
import Step1Region from './components/step-1-region'
import Step2Info from './components/step-2-info'
import Step3Needs from './components/step-3-needs'
import Step4Confirm from './components/step-4-confirm'
import SuccessPage from './components/success-page'

export type Region = {
  id: string
  name: string
  slug: string
  country_code: string
  country_name: string
  platform_label: string
  currency_code: string
  currency_symbol: string
  phone_prefix: string
  is_active: boolean
  tenant_count?: number
}

export type WizardState = {
  currentStep: number
  region: Region | null
  firstName: string
  lastName: string
  ownerEmail: string
  phone: string
  restaurantName: string
  city: string
  message: string
  serviceTypes: string[]
  teamSize: string
  modules: string[]
  isSubmitting: boolean
  submittedId: string | null
}

export type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_REGION'; region: Region }
  | { type: 'SET_FIELD'; field: string; value: string }
  | { type: 'TOGGLE_ARRAY'; field: 'serviceTypes' | 'modules'; value: string }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'SET_SUBMITTED'; id: string }

const initialState: WizardState = {
  currentStep: 1,
  region: null,
  firstName: '',
  lastName: '',
  ownerEmail: '',
  phone: '',
  restaurantName: '',
  city: '',
  message: '',
  serviceTypes: [],
  teamSize: '',
  modules: [],
  isSubmitting: false,
  submittedId: null,
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step }
    case 'SET_REGION':
      return { ...state, region: action.region }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'TOGGLE_ARRAY': {
      const arr = state[action.field]
      return {
        ...state,
        [action.field]: arr.includes(action.value)
          ? arr.filter((v) => v !== action.value)
          : [...arr, action.value],
      }
    }
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.value }
    case 'SET_SUBMITTED':
      return { ...state, submittedId: action.id, isSubmitting: false }
    default:
      return state
  }
}

export default function RegisterPage() {
  const [state, dispatch] = useReducer(wizardReducer, initialState)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [state.currentStep])

  if (state.submittedId) {
    return <SuccessPage state={state} />
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[#E7E5E4] px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <span className="font-heading text-xl font-bold text-[#C8553D]">TérangaTable</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="sticky top-0 z-10 border-b border-[#E7E5E4] bg-white px-4 py-5 shadow-sm">
        <div className="mx-auto max-w-2xl">
          <WizardProgress currentStep={state.currentStep} />
        </div>
      </div>

      {/* Step content */}
      <main className="mx-auto max-w-2xl px-4 py-8 pb-16">
        {state.currentStep === 1 && (
          <Step1Region
            state={state}
            onSelect={(region) => {
              dispatch({ type: 'SET_REGION', region })
              dispatch({ type: 'SET_STEP', step: 2 })
            }}
          />
        )}
        {state.currentStep === 2 && (
          <Step2Info
            state={state}
            dispatch={dispatch}
            onNext={() => dispatch({ type: 'SET_STEP', step: 3 })}
            onBack={() => dispatch({ type: 'SET_STEP', step: 1 })}
          />
        )}
        {state.currentStep === 3 && (
          <Step3Needs
            state={state}
            dispatch={dispatch}
            onNext={() => dispatch({ type: 'SET_STEP', step: 4 })}
            onBack={() => dispatch({ type: 'SET_STEP', step: 2 })}
          />
        )}
        {state.currentStep === 4 && (
          <Step4Confirm
            state={state}
            dispatch={dispatch}
            onBack={() => dispatch({ type: 'SET_STEP', step: 3 })}
            onSubmitted={(id) => dispatch({ type: 'SET_SUBMITTED', id })}
          />
        )}
      </main>
    </div>
  )
}
