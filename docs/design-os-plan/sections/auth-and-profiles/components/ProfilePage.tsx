import { useState } from 'react'
import type {
  AuthUser,
  DiveReportSummary,
  CreatedSpot,
  FavoriteSpot,
  ActivityStats,
  EditProfilePayload,
  ChangePasswordPayload,
} from '../types'

export interface ProfilePageProps {
  currentUser: AuthUser
  diveReports: DiveReportSummary[]
  createdSpots: CreatedSpot[]
  favorites: FavoriteSpot[]
  stats: ActivityStats
  onEditProfile?: (updates: EditProfilePayload) => void
  onChangePassword?: (payload: ChangePasswordPayload) => void
  onLogout?: () => void
  onChangeLanguage?: (lang: 'no' | 'en') => void
}

type ProfileView = 'menu' | 'reports' | 'spots' | 'favorites' | 'password' | 'language' | 'legal'

function UserAvatar({ user, size = 'md' }: { user: AuthUser; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-10 h-10 text-sm', md: 'w-14 h-14 text-base', lg: 'w-20 h-20 text-xl' }
  const initials = user.alias
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.alias}
        className={`${sizes[size]} rounded-full object-cover`}
      />
    )
  }
  return (
    <div
      className={`${sizes[size]} rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center font-semibold text-emerald-300`}
      style={{ fontFamily: 'Space Grotesk, sans-serif' }}
    >
      {initials}
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 12 12"
          className={`w-3 h-3 ${i <= rating ? 'text-emerald-400' : 'text-stone-300 dark:text-stone-700'}`}
        >
          <path
            d="M6 1l1.2 3.6H11L8.1 6.9l1.1 3.6L6 8.4l-3.2 2.1 1.1-3.6L1 4.6h3.8L6 1z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatMonthYear(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

const currentLabels: Record<number, string> = {
  1: 'Calm',
  2: 'Light',
  3: 'Moderate',
  4: 'Strong',
  5: 'Very strong',
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-stone-400 dark:text-stone-500 flex-shrink-0">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium py-4 px-5 hover:opacity-75 transition-opacity"
    >
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
        <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="px-5 pt-6 pb-2 text-[10px] font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500">
      {title}
    </p>
  )
}

function SettingsRow({
  label,
  value,
  onPress,
  destructive = false,
  showChevron = true,
}: {
  label: string
  value?: string
  onPress: () => void
  destructive?: boolean
  showChevron?: boolean
}) {
  return (
    <button
      onClick={onPress}
      className="w-full flex items-center justify-between px-5 py-3.5 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 last:border-b-0 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-left"
    >
      <span
        className={`text-sm font-medium ${
          destructive ? 'text-red-500 dark:text-red-400' : 'text-stone-900 dark:text-white'
        }`}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        {value && (
          <span className="text-sm text-stone-400 dark:text-stone-500">{value}</span>
        )}
        {showChevron && <ChevronRight />}
      </div>
    </button>
  )
}

export function ProfilePage({
  currentUser,
  diveReports,
  createdSpots,
  favorites,
  stats,
  onEditProfile,
  onChangePassword,
  onLogout,
  onChangeLanguage,
}: ProfilePageProps) {
  const [view, setView] = useState<ProfileView>('menu')
  const [isEditing, setIsEditing] = useState(false)
  const [language, setLanguage] = useState<'no' | 'en'>(
    (currentUser as AuthUser & { preferredLanguage?: 'no' | 'en' }).preferredLanguage ?? 'en'
  )

  // Edit form state
  const [editAlias, setEditAlias] = useState(currentUser.alias)
  const [editBio, setEditBio] = useState(currentUser.bio ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Password form state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setAvatarPreview(URL.createObjectURL(file))
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    const input = document.getElementById('profile-avatar-input') as HTMLInputElement
    const avatar = input?.files?.[0] ?? null
    onEditProfile?.({ alias: editAlias, bio: editBio, avatar })
    setIsEditing(false)
  }

  function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (currentPw && newPw) {
      onChangePassword?.({ currentPassword: currentPw, newPassword: newPw })
      setCurrentPw('')
      setNewPw('')
      setView('menu')
    }
  }

  function handleLanguageSelect(lang: 'no' | 'en') {
    setLanguage(lang)
    onChangeLanguage?.(lang)
  }

  const editInputClass =
    'w-full bg-white/8 border border-white/20 text-white placeholder:text-white/30 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400/50 transition-all'

  const languageLabel = language === 'no' ? 'Norsk' : 'English'

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      {/* Profile header band */}
      <div className="bg-gradient-to-br from-stone-800 via-stone-900 to-teal-950 px-5 pt-14 pb-6">
        {isEditing ? (
          <form onSubmit={handleSaveProfile}>
            <div className="flex items-start gap-4 mb-5">
              <div className="relative flex-shrink-0">
                <label htmlFor="profile-avatar-input" className="cursor-pointer block">
                  {avatarPreview || currentUser.avatarUrl ? (
                    <img
                      src={avatarPreview ?? currentUser.avatarUrl ?? ''}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-emerald-400/25"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-dashed border-emerald-400/30 flex items-center justify-center">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7 text-emerald-400/40">
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-stone-900">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 text-white">
                      <path
                        d="M1.5 9L5 5.5l2 2 3.5-4.5M9 1.5h1.5V3"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </label>
                <input
                  id="profile-avatar-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="flex-1 space-y-2.5 min-w-0">
                <input
                  type="text"
                  value={editAlias}
                  onChange={(e) => setEditAlias(e.target.value)}
                  placeholder="Alias"
                  className={editInputClass}
                  required
                />
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Short bio..."
                  rows={2}
                  className={`${editInputClass} resize-none`}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 border border-white/15 text-white/60 rounded-xl py-2.5 text-sm font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
              >
                Save changes
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-4">
                <UserAvatar user={currentUser} size="lg" />
                <div className="min-w-0">
                  <h2
                    className="text-white font-semibold text-lg leading-tight truncate"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {currentUser.alias}
                  </h2>
                  <p className="text-white/35 text-xs mt-0.5 truncate">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-shrink-0 border border-white/15 text-white/50 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/8 hover:text-white/80 transition-colors"
              >
                Edit
              </button>
            </div>
            {currentUser.bio && (
              <p className="text-white/45 text-sm leading-relaxed">{currentUser.bio}</p>
            )}
          </div>
        )}
      </div>

      {/* Stat strip */}
      {!isEditing && (
        <div className="grid grid-cols-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
          {[
            { value: stats.totalReports, label: 'Reports' },
            { value: stats.uniqueSpotsDived, label: 'Spots' },
            { value: stats.favoritesCount, label: 'Saved' },
            { value: formatMonthYear(stats.memberSince), label: 'Since' },
          ].map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center py-4 border-r last:border-r-0 border-stone-100 dark:border-stone-800"
            >
              <span
                className="text-xl font-bold text-stone-900 dark:text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {s.value}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main content — switches based on view */}
      {!isEditing && (
        <>
          {/* MENU */}
          {view === 'menu' && (
            <div className="pb-8">
              {/* ACTIVITY group */}
              <SectionHeader title="Activity" />
              <div className="mx-4 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800">
                <SettingsRow
                  label="Dive Reports"
                  value={String(diveReports.length)}
                  onPress={() => setView('reports')}
                />
                <SettingsRow
                  label="My Spots"
                  value={String(createdSpots.length)}
                  onPress={() => setView('spots')}
                />
                <SettingsRow
                  label="Saved Spots"
                  value={String(favorites.length)}
                  onPress={() => setView('favorites')}
                />
              </div>

              {/* ACCOUNT group */}
              <SectionHeader title="Account" />
              <div className="mx-4 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800">
                <SettingsRow
                  label="Language"
                  value={languageLabel}
                  onPress={() => setView('language')}
                />
                <SettingsRow
                  label="Password"
                  onPress={() => setView('password')}
                />
              </div>

              {/* MORE group */}
              <SectionHeader title="More" />
              <div className="mx-4 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800">
                <SettingsRow
                  label="Legal"
                  onPress={() => setView('legal')}
                />
                <SettingsRow
                  label="Log out"
                  onPress={() => onLogout?.()}
                  destructive
                  showChevron={false}
                />
              </div>
            </div>
          )}

          {/* DIVE REPORTS */}
          {view === 'reports' && (
            <div>
              <BackButton onBack={() => setView('menu')} />
              <h2
                className="px-5 pb-4 text-lg font-semibold text-stone-900 dark:text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Dive Reports
              </h2>
              <div className="px-4 space-y-3 pb-8">
                {diveReports.length === 0 ? (
                  <div className="text-center py-14">
                    <p className="text-stone-300 dark:text-stone-700 text-3xl mb-3">🤿</p>
                    <p className="text-sm text-stone-400 dark:text-stone-600">No dive reports yet</p>
                  </div>
                ) : (
                  diveReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-100 dark:border-stone-800"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-stone-900 dark:text-white text-sm truncate">
                            {report.spotName}
                          </p>
                          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                            {formatDate(report.date)}
                          </p>
                        </div>
                        <StarRating rating={report.overallRating} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                          {report.visibilityMeters}m vis
                        </span>
                        <span>{currentLabels[report.currentStrength]} current</span>
                      </div>
                      {report.notes && (
                        <p className="text-xs text-stone-400 dark:text-stone-500 mt-2 leading-relaxed line-clamp-2">
                          {report.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* MY SPOTS */}
          {view === 'spots' && (
            <div>
              <BackButton onBack={() => setView('menu')} />
              <h2
                className="px-5 pb-4 text-lg font-semibold text-stone-900 dark:text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                My Spots
              </h2>
              <div className="px-4 space-y-3 pb-8">
                {createdSpots.length === 0 ? (
                  <div className="text-center py-14">
                    <p className="text-stone-300 dark:text-stone-700 text-3xl mb-3">📍</p>
                    <p className="text-sm text-stone-400 dark:text-stone-600">No spots created yet</p>
                  </div>
                ) : (
                  createdSpots.map((spot) => (
                    <div
                      key={spot.id}
                      className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900 dark:text-white text-sm truncate">
                          {spot.name}
                        </p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">{spot.locationDescription}</p>
                        <p className="text-xs text-stone-400 dark:text-stone-600 mt-1">
                          {spot.reportCount} {spot.reportCount === 1 ? 'report' : 'reports'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className="text-lg font-bold text-emerald-600 dark:text-emerald-400"
                          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                        >
                          {spot.maxDepthMeters}m
                        </p>
                        <p className="text-[10px] text-stone-400">max depth</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* FAVORITES */}
          {view === 'favorites' && (
            <div>
              <BackButton onBack={() => setView('menu')} />
              <h2
                className="px-5 pb-4 text-lg font-semibold text-stone-900 dark:text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Saved Spots
              </h2>
              <div className="px-4 space-y-3 pb-8">
                {favorites.length === 0 ? (
                  <div className="text-center py-14">
                    <p className="text-stone-300 dark:text-stone-700 text-3xl mb-3">♥</p>
                    <p className="text-sm text-stone-400 dark:text-stone-600">No saved spots yet</p>
                  </div>
                ) : (
                  favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-100 dark:border-stone-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 dark:text-white text-sm truncate">
                            {fav.spotName}
                          </p>
                          <p className="text-xs text-stone-400 dark:text-stone-500">{fav.locationDescription}</p>
                        </div>
                        {fav.latestVisibilityMeters !== null ? (
                          <div className="text-right flex-shrink-0">
                            <p
                              className="text-sm font-bold text-teal-600 dark:text-teal-400"
                              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                            >
                              {fav.latestVisibilityMeters}m
                            </p>
                            <p className="text-[10px] text-stone-400">visibility</p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-stone-300 dark:text-stone-600 flex-shrink-0">
                            No reports
                          </span>
                        )}
                      </div>
                      {fav.latestReportDate && (
                        <p className="text-[10px] text-stone-300 dark:text-stone-600 mt-2">
                          Last report {formatDate(fav.latestReportDate)}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* LANGUAGE */}
          {view === 'language' && (
            <div>
              <BackButton onBack={() => setView('menu')} />
              <h2
                className="px-5 pb-4 text-lg font-semibold text-stone-900 dark:text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Language
              </h2>
              <div className="mx-4 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800">
                {([
                  { value: 'en', label: 'English' },
                  { value: 'no', label: 'Norsk' },
                ] as { value: 'en' | 'no'; label: string }[]).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleLanguageSelect(option.value)}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 last:border-b-0 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                  >
                    <span className="text-sm font-medium text-stone-900 dark:text-white">{option.label}</span>
                    {language === option.value && (
                      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-emerald-500">
                        <path
                          d="M3 8l3.5 3.5 6.5-7"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASSWORD */}
          {view === 'password' && (
            <div>
              <BackButton onBack={() => setView('menu')} />
              <h2
                className="px-5 pb-4 text-lg font-semibold text-stone-900 dark:text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Change Password
              </h2>
              <form onSubmit={handleSavePassword} className="px-4 space-y-3 pb-8">
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                  required
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl py-3 text-sm font-semibold transition-colors mt-2"
                >
                  Save password
                </button>
              </form>
            </div>
          )}

          {/* LEGAL */}
          {view === 'legal' && (
            <div>
              <BackButton onBack={() => setView('menu')} />
              <h2
                className="px-5 pb-4 text-lg font-semibold text-stone-900 dark:text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Legal
              </h2>
              <div className="px-4 space-y-4 pb-8 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                <p>
                  Freedive is provided as-is. By using this app you agree to our Terms of Service and Privacy Policy.
                  Your data is stored securely and never sold to third parties.
                </p>
                <p>
                  Freediving is an inherently risky activity. Always dive with a buddy, follow safe freediving
                  practices, and never dive alone. This app does not replace proper training or supervision.
                </p>
                <p className="text-stone-400 dark:text-stone-600 text-xs">Freedive v1.0.0 · © 2026</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
