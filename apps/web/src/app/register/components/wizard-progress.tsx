'use client'

const STEPS = [
  { n: 1, label: 'Région' },
  { n: 2, label: 'Restaurant' },
  { n: 3, label: 'Besoins' },
  { n: 4, label: 'Confirmation' },
]

export default function WizardProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const done = currentStep > step.n
        const active = currentStep === step.n
        return (
          <div key={step.n} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* Left connector */}
              {i > 0 && (
                <div
                  className="h-0.5 flex-1 transition-all duration-500"
                  style={{ background: done || active ? '#C8553D' : '#E7E5E4' }}
                />
              )}

              {/* Circle */}
              <div
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300',
                  done
                    ? 'bg-[#C8553D] text-white shadow-[0_0_0_3px_rgba(200,85,61,0.15)]'
                    : active
                    ? 'scale-110 bg-[#C8553D] text-white shadow-[0_0_0_3px_rgba(200,85,61,0.20)]'
                    : 'bg-[#E7E5E4] text-slate-400',
                ].join(' ')}
              >
                {done ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M3.5 8.5l3 3 6-6"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  step.n
                )}
              </div>

              {/* Right connector */}
              {i < STEPS.length - 1 && (
                <div
                  className="h-0.5 flex-1 transition-all duration-500"
                  style={{ background: currentStep > step.n ? '#C8553D' : '#E7E5E4' }}
                />
              )}
            </div>

            <span
              className={[
                'mt-2 text-xs font-medium transition-colors duration-300',
                active ? 'text-[#C8553D]' : done ? 'text-[#C8553D]' : 'text-slate-400',
              ].join(' ')}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
