import { useState } from 'react'
import type { DiveSpot, DiveReport } from '../types'
import { SpotReportRow } from './SpotReportRow'

function FractionalStar({ fill, size = 'w-4 h-4' }: { fill: number; size?: string }) {
  const starPath = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'
  return (
    <span className={`relative inline-block ${size}`}>
      <svg className={`${size} text-stone-200 dark:text-stone-700`} fill="currentColor" viewBox="0 0 20 20">
        <path d={starPath} />
      </svg>
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
        <svg className={`${size} text-amber-400`} fill="currentColor" viewBox="0 0 20 20">
          <path d={starPath} />
        </svg>
      </span>
    </span>
  )
}

function visibilityInfo(isoDate: string): { label: string; isStale: boolean } {
  const days = Math.round((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
  const isStale = days > 30
  const label = days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
  return { label, isStale }
}

interface Props {
  spot: DiveSpot
  reports: DiveReport[]
  onDismiss: () => void
  onFavoriteToggle: (spotId: string, current: boolean) => void
  onAddDive: () => void
  onUpdateRating: (rating: 1 | 2 | 3 | 4 | 5) => void
}

export function SpotDetailSheet({ spot, reports, onDismiss, onFavoriteToggle, onAddDive, onUpdateRating }: Props) {
  const [isFavorited, setIsFavorited] = useState(spot.isFavorited)
  const [isRatingOpen, setIsRatingOpen] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  const spotReports = [...reports]
    .filter((r) => r.spotId === spot.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  function handleFavoriteToggle() {
    const next = !isFavorited
    setIsFavorited(next)
    onFavoriteToggle(spot.id, !next)
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/85 dark:bg-stone-900/90 backdrop-blur-xl border-t border-white/40 dark:border-stone-700/50 rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
      {/* Sticky header */}
      <div className="sticky top-0 bg-white/85 dark:bg-stone-900/90 backdrop-blur-xl px-4 pt-3 pb-3 border-b border-stone-100/50 dark:border-stone-800/50">
        {/* Drag handle */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full" />
        </div>

        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-[Space_Grotesk,sans-serif] leading-tight">
            {spot.name}
          </h2>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {/* Heart/favorite */}
            <button
              onClick={handleFavoriteToggle}
              className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                className={`w-5 h-5 ${isFavorited ? 'text-emerald-600' : 'text-stone-400'}`}
                fill={isFavorited ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5 text-stone-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Visibility row */}
        <div className="flex items-center gap-1.5 mt-2">
          <svg
            className="w-4 h-4 text-stone-400 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          {spot.latestReport == null ? (
            <span className="text-sm text-stone-400 font-[Inter,sans-serif]">No data yet</span>
          ) : (
            <span
              className={`text-sm font-[Inter,sans-serif] ${
                visibilityInfo(spot.latestReport.date).isStale
                  ? 'text-amber-500'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {spot.latestReport.visibility}m · {visibilityInfo(spot.latestReport.date).label}
            </span>
          )}
        </div>

        {/* Stars + Add Dive */}
        <div className="mt-2 flex items-center justify-between gap-3">
          {/* Fractional stars — click to open rating overlay */}
          <button
            onClick={() => setIsRatingOpen(true)}
            className="flex items-center gap-1"
            aria-label="Rate this spot"
          >
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => {
                const fill = Math.min(Math.max((spot.averageRating ?? 0) - i, 0), 1)
                return <FractionalStar key={i} fill={fill} />
              })}
            </span>
            {spot.reportCount > 0 && (
              <span className="text-xs text-stone-400 dark:text-stone-500 font-[Inter,sans-serif]">
                {spot.reportCount}
              </span>
            )}
          </button>
          {/* Add Dive pill */}
          <button
            onClick={onAddDive}
            className="shrink-0 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 px-4 py-2 rounded-xl transition-colors font-[Inter,sans-serif]"
          >
            ＋ Add Dive
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-8 pt-4 space-y-4">
        {/* Description */}
        <p className="text-sm text-stone-700 dark:text-stone-300 font-[Inter,sans-serif] leading-relaxed">
          {spot.description}
        </p>

        {/* Access info */}
        <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <svg
              className="w-3.5 h-3.5 text-stone-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide font-[Inter,sans-serif]">
              Access
            </span>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400 font-[Inter,sans-serif] leading-relaxed">
            {spot.accessInfo}
          </p>
        </div>

        {/* Photos */}
        {spot.photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {spot.photos.map((photo) => (
              <div key={photo.id} className="shrink-0">
                <img
                  src={photo.url}
                  alt={photo.caption ?? spot.name}
                  className="h-32 w-48 object-cover rounded-xl"
                />
              </div>
            ))}
          </div>
        )}

        {/* Dive Logs */}
        <div>
          <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 font-[Space_Grotesk,sans-serif] mb-2">
            Dive Logs ({spotReports.length})
          </h3>
          {spotReports.length === 0 ? (
            <p className="text-sm text-stone-400 font-[Inter,sans-serif] py-2">
              No dive logs yet. Be the first!
            </p>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {spotReports.map((report) => (
                <SpotReportRow key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rating overlay */}
      {isRatingOpen && (
        <div className="fixed inset-0 z-50 flex items-end pb-8 justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setIsRatingOpen(false); setHoverRating(0) }}
          />
          {/* Card */}
          <div className="relative bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl rounded-2xl p-6 mx-4 w-full max-w-sm">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-[Space_Grotesk,sans-serif]">
              Rate this spot
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 font-[Inter,sans-serif] mt-0.5 mb-5">
              {spot.name}
            </p>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < (hoverRating || spot.currentUserRating || 0)
                return (
                  <button
                    key={i}
                    onMouseEnter={() => setHoverRating(i + 1)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => {
                      onUpdateRating((i + 1) as 1 | 2 | 3 | 4 | 5)
                      setIsRatingOpen(false)
                      setHoverRating(0)
                    }}
                    aria-label={`Rate ${i + 1} stars`}
                  >
                    <svg
                      className={`w-10 h-10 ${filled ? 'text-amber-400' : 'text-stone-200 dark:text-stone-700'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => { setIsRatingOpen(false); setHoverRating(0) }}
              className="mt-5 text-sm text-stone-500 dark:text-stone-400 font-[Inter,sans-serif] hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
