import { useState } from 'react'
import type { DiveLog } from '../types'

interface AddDiveFormProps {
  spotId: string
  spotName: string
  authorAlias: string
  authorAvatarUrl: string | null
  hasExistingRating: boolean
  onSubmit: (log: Omit<DiveLog, 'id' | 'createdAt'>) => void
  onDismiss: () => void
}

const CURRENT_OPTIONS: { value: 1 | 2 | 3 | 4 | 5; label: string; short: string }[] = [
  { value: 1, label: 'Calm', short: 'Calm' },
  { value: 2, label: 'Light', short: 'Light' },
  { value: 3, label: 'Moderate', short: 'Mod.' },
  { value: 4, label: 'Strong', short: 'Strong' },
  { value: 5, label: 'Very Strong', short: 'V. Strong' },
]

export function AddDiveForm({
  spotId,
  spotName,
  authorAlias,
  authorAvatarUrl,
  onSubmit,
  onDismiss,
}: AddDiveFormProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [visibility, setVisibility] = useState(8)
  const [current, setCurrent] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [photos] = useState<string[]>([])

  const visibilityPercent = (visibility / 30) * 100

  function handleSubmit() {
    onSubmit({
      spotId,
      authorAlias,
      authorAvatarUrl,
      visibility,
      current,
      notes: notes.trim() || null,
      photos,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onDismiss}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg mx-auto max-h-[92vh] bg-white dark:bg-stone-950 rounded-t-3xl shadow-2xl overflow-y-auto">

        {/* Sticky header */}
        <div className="sticky top-0 bg-white dark:bg-stone-950 z-10 pt-3">
          {/* Pull handle */}
          <div className="flex justify-center mb-4">
            <div className="w-9 h-1 rounded-full bg-stone-200 dark:bg-stone-700" />
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between px-6 pb-3">
            <div>
              {/* Step progress */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  <div className="h-0.5 w-10 rounded-full bg-emerald-500" />
                  <div
                    className={`h-0.5 w-10 rounded-full transition-colors duration-300 ${
                      step === 2 ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-700'
                    }`}
                  />
                </div>
                <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
                  Step {step} of 2
                </span>
              </div>

              <h2
                className="text-[22px] font-semibold text-stone-900 dark:text-stone-50 leading-tight"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {step === 1 ? 'Log a Dive' : 'Notes & Photos'}
              </h2>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                {spotName}
              </p>
            </div>

            <button
              onClick={onDismiss}
              className="mt-1 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="h-px bg-stone-100 dark:bg-stone-800" />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="px-6 pt-7 pb-10">

            {/* Visibility */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                    Visibility
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="text-3xl font-bold text-stone-900 dark:text-stone-50 tabular-nums"
                    style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                  >
                    {visibility}
                  </span>
                  <span className="text-sm font-medium text-stone-400 dark:text-stone-500 ml-1">
                    m
                  </span>
                </div>
              </div>

              {/* Slider */}
              <div className="relative" style={{ height: '32px' }}>
                {/* Track */}
                <div className="absolute top-1/2 left-0 right-0 h-3 rounded-full -translate-y-1/2 bg-stone-200 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-none"
                    style={{
                      width: `${visibilityPercent}%`,
                      background: 'linear-gradient(to right, #0f766e, #059669, #34d399)',
                    }}
                  />
                </div>
                {/* Thumb */}
                <div
                  className="absolute top-1/2 w-7 h-7 bg-white dark:bg-stone-950 rounded-full shadow-md border-[2.5px] border-emerald-500 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                  style={{ left: `${visibilityPercent}%` }}
                />
                {/* Native range (invisible, handles input) */}
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={visibility}
                  onChange={e => setVisibility(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex justify-between mt-2.5 text-xs text-stone-400 dark:text-stone-600">
                <span>0 m</span>
                <span>15 m</span>
                <span>30 m</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-stone-100 dark:bg-stone-800 -mx-6 my-6" />

            {/* Current */}
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-3">
                Current
              </p>

              <div className="grid grid-cols-5 gap-1.5">
                {CURRENT_OPTIONS.map(({ value, label, short }) => {
                  const isSelected = current === value
                  return (
                    <button
                      key={value}
                      onClick={() => setCurrent(value)}
                      className={`py-3 px-1 rounded-2xl text-center transition-all duration-150 border ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                          : 'bg-transparent border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-emerald-300 dark:hover:border-emerald-800'
                      }`}
                    >
                      {/* Intensity bars */}
                      <div className="flex justify-center items-end gap-0.5 mb-2.5 h-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full transition-all ${
                              i < value
                                ? 'bg-emerald-500'
                                : 'bg-stone-200 dark:bg-stone-700'
                            }`}
                            style={{ height: `${28 + i * 12}%` }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-medium leading-tight block">
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>

            </div>

            {/* Divider */}
            <div className="h-px bg-stone-100 dark:bg-stone-800 -mx-6 my-6" />

            {/* Date */}
            <div>
              <label className="text-sm font-semibold text-stone-800 dark:text-stone-200 block mb-0.5">
                Date of dive
                <span className="text-xs font-normal text-stone-400 dark:text-stone-500 ml-2">
                  optional · defaults to today
                </span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="mt-6">
              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 text-sm font-semibold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                style={{ color: 'white' }}
              >
                <span style={{ color: 'white' }}>Next</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'white' }}>
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="px-6 pt-7 pb-10 space-y-8">

            {/* Notes */}
            <div>
              <label className="text-sm font-semibold text-stone-800 dark:text-stone-200 block mb-0.5">
                Notes
                <span className="text-xs font-normal text-stone-400 dark:text-stone-500 ml-2">optional</span>
              </label>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">
                Conditions, sightings, tips for other divers
              </p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Calm after two days without wind. Eelgrass thick at 5m. Saw a juvenile flatfish at 8m…"
                rows={5}
                maxLength={500}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none leading-relaxed"
              />
              <div className="flex justify-end mt-1.5">
                <span className="text-xs text-stone-400 dark:text-stone-600">{notes.length} / 500</span>
              </div>
            </div>

            {/* Photos */}
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-0.5">Photos</p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">Up to 5 photos from your dive</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 hover:border-emerald-400 dark:hover:border-emerald-700 hover:text-emerald-500 dark:hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="mb-0.5">
                    <path d="M9 4v10M4 9h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="text-[9px] font-medium leading-none">Photo</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setStep(1)}
                className="py-3.5 px-5 rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors whitespace-nowrap"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 text-sm font-semibold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25"
                style={{ color: 'white' }}
              >
                <span style={{ color: 'white' }}>Submit Dive</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
