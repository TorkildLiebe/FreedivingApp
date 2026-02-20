import type { MapAndSpotsProps } from '../types'
import { SpotDetailSheet } from './SpotDetailSheet'
import { CreateSpotOverlay } from './CreateSpotOverlay'

export function MapAndSpots({
  data,
  activeSpotId,
  isCreatingSpot,
  onSpotDismiss,
  onFavoriteToggle,
  onCreateSpotStart,
  onCreateSpotConfirm,
  onCreateSpotCancel,
  onAddDive,
  onUpdateRating,
}: MapAndSpotsProps) {
  const activeSpot = activeSpotId ? (data.spots.find((s) => s.id === activeSpotId) ?? null) : null

  if (isCreatingSpot) {
    return (
      <div className="absolute inset-0">
        <CreateSpotOverlay onConfirm={onCreateSpotConfirm} onCancel={onCreateSpotCancel} />
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      {/* Spot detail sheet */}
      {activeSpot && (
        <SpotDetailSheet
          spot={activeSpot}
          reports={data.reports}
          onDismiss={onSpotDismiss}
          onFavoriteToggle={onFavoriteToggle}
          onAddDive={() => onAddDive(activeSpot.id)}
          onUpdateRating={(rating) => onUpdateRating(activeSpot.id, rating)}
        />
      )}

      {/* FAB — only shown when no active spot */}
      {!activeSpotId && (
        <button
          onClick={onCreateSpotStart}
          className="absolute bottom-24 right-4 z-10 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-full shadow-[0_4px_24px_rgba(5,150,105,0.4)] flex items-center justify-center transition-colors"
          aria-label="Add dive spot"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  )
}
