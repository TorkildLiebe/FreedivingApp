import type { DiveReport } from '../types'

function relativeDate(isoDate: string): string {
  const days = Math.round((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

interface Props {
  report: DiveReport
}

export function SpotReportRow({ report }: Props) {
  const initials = report.authorAlias.slice(0, 2).toUpperCase()

  return (
    <div className="flex gap-3 py-3">
      {/* Avatar */}
      <div className="shrink-0">
        {report.authorAvatarUrl ? (
          <img
            src={report.authorAvatarUrl}
            alt={report.authorAlias}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-300 font-[Inter,sans-serif]">
              {initials}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-stone-800 dark:text-stone-200 font-[Inter,sans-serif]">
            {report.authorAlias}
          </span>
          <span className="text-xs text-stone-400 dark:text-stone-500 font-[Inter,sans-serif] shrink-0">
            {relativeDate(report.createdAt)}
          </span>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.5 rounded font-[Inter,sans-serif]">
            {report.visibility}m
          </span>
          {/* Current strength dots */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < report.current ? 'bg-teal-500' : 'bg-stone-200 dark:bg-stone-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Notes */}
        {report.notes && (
          <p className="text-sm text-stone-600 dark:text-stone-400 font-[Inter,sans-serif] mt-1 line-clamp-2">
            {report.notes}
          </p>
        )}
      </div>
    </div>
  )
}
