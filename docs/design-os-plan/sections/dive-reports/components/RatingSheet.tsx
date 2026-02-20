import { useState } from 'react'

interface RatingSheetProps {
  spotName: string
  onRate: (rating: 1 | 2 | 3 | 4 | 5) => void
  onDismiss: () => void
}

const RATING_LABELS: Record<number, string> = {
  1: 'Not great',
  2: 'It was okay',
  3: 'Pretty good',
  4: 'Really good',
  5: 'Outstanding',
}

export function RatingSheet({ spotName, onRate, onDismiss }: RatingSheetProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(null)

  const activeRating = hovered ?? selected

  function handleSelect(rating: 1 | 2 | 3 | 4 | 5) {
    setSelected(rating)
    setTimeout(() => onRate(rating), 350)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onDismiss}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-stone-950 rounded-t-3xl shadow-2xl pb-12 overflow-hidden">
        {/* Pull handle */}
        <div className="flex justify-center pt-3 mb-6">
          <div className="w-9 h-1 rounded-full bg-stone-200 dark:bg-stone-700" />
        </div>

        {/* Emerald accent bar at top */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500" />

        <div className="px-8 text-center">
          {/* Success indicator */}
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center mx-auto mb-5">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path
                d="M4 11.5L8.5 16L18 7"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-widest font-medium mb-2">
            Dive logged
          </p>
          <h2
            className="text-2xl font-semibold text-stone-900 dark:text-stone-50 leading-snug mb-1"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            How would you rate
          </h2>
          <h2
            className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 leading-snug mb-8"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {spotName}?
          </h2>

          {/* Stars */}
          <div
            className="flex justify-center gap-2 mb-3"
            onMouseLeave={() => setHovered(null)}
          >
            {([1, 2, 3, 4, 5] as const).map((star) => {
              const isActive = activeRating !== null && star <= activeRating
              return (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onClick={() => handleSelect(star)}
                  className={`text-5xl leading-none transition-all duration-100 ${
                    isActive ? 'scale-110' : 'scale-100 hover:scale-105'
                  }`}
                >
                  <span
                    className={`transition-colors duration-100 ${
                      isActive
                        ? 'text-emerald-500'
                        : 'text-stone-200 dark:text-stone-700 hover:text-stone-300 dark:hover:text-stone-600'
                    }`}
                  >
                    ★
                  </span>
                </button>
              )
            })}
          </div>

          {/* Dynamic label */}
          <div className="h-5 mb-8">
            {activeRating !== null && (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {RATING_LABELS[activeRating]}
              </p>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors py-2 font-medium"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
