import { useRef, useState } from 'react'
import type { CreateSpotPayload } from '../types'

type CreationStep = 'placing' | 'filling_form' | 'placing_parking'

interface PendingParking {
  id: string
  description: string
  position: { lat: number; lng: number }
}

interface Props {
  onConfirm: (payload: CreateSpotPayload) => void
  onCancel: () => void
}

export function CreateSpotOverlay({ onConfirm, onCancel }: Props) {
  const [step, setStep] = useState<CreationStep>('placing')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [accessInfo, setAccessInfo] = useState('')
  const [parkings, setParkings] = useState<PendingParking[]>([])
  const [parkingDescription, setParkingDescription] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePhotoFiles(files: FileList | null) {
    if (!files) return
    const urls = Array.from(files).map((f) => URL.createObjectURL(f))
    setPhotos((prev) => [...prev, ...urls])
  }

  function handleRemovePhoto(url: string) {
    setPhotos((prev) => prev.filter((u) => u !== url))
    URL.revokeObjectURL(url)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: CreateSpotPayload = {
      name,
      description,
      accessInfo,
      position: { lat: 0, lng: 0 },
      photoUris: photos,
    }
    console.log('Creating spot:', payload, 'Parking locations:', parkings)
    onConfirm(payload)
  }

  function handleAddParking() {
    setParkings((prev) => [
      ...prev,
      {
        id: `parking-new-${Date.now()}`,
        description: parkingDescription,
        position: { lat: 0, lng: 0 },
      },
    ])
    setParkingDescription('')
    setStep('filling_form')
  }

  function handleRemoveParking(id: string) {
    setParkings((prev) => prev.filter((p) => p.id !== id))
  }

  const mapPin =
    step === 'placing_parking' ? (
      <div className="relative flex items-center justify-center">
        <div className="absolute w-12 h-12 rounded-full bg-teal-400/50 animate-ping" />
        <svg
          className="relative z-10 w-10 h-10 text-teal-600 drop-shadow-lg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      </div>
    ) : (
      <div className="relative flex items-center justify-center">
        {step === 'placing' && (
          <div className="absolute w-12 h-12 rounded-full bg-emerald-400/50 animate-ping" />
        )}
        <svg
          className="relative z-10 w-10 h-10 text-emerald-600 drop-shadow-lg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      </div>
    )

  return (
    <div className="flex flex-col h-full">
      {/* Dark vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.35)_100%)] pointer-events-none z-0" />

      {/* Map area */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative z-10">
        {(step === 'placing' || step === 'placing_parking') && (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-20">
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-full px-4 py-1.5 shadow-lg border border-white/40 dark:border-stone-700/50 whitespace-nowrap">
              <span className="text-sm text-stone-700 dark:text-stone-300 font-[Inter,sans-serif]">
                {step === 'placing_parking'
                  ? 'Pan & zoom to position parking'
                  : 'Pan & zoom to position your spot'}
              </span>
            </div>
          </div>
        )}
        {mapPin}
      </div>

      {/* Bottom panel */}
      <div className="relative z-10 bg-white/85 dark:bg-stone-900/90 backdrop-blur-xl border-t border-white/40 dark:border-stone-700/50 px-4 pt-4 pb-8">
        {step === 'placing' && (
          <>
            <button
              type="button"
              onClick={() => setStep('filling_form')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold font-[Inter,sans-serif] rounded-xl transition-colors shadow-lg"
            >
              Create Dive Spot
            </button>
            <div className="flex justify-center mt-3">
              <button
                type="button"
                onClick={onCancel}
                className="text-sm text-stone-500 dark:text-stone-400 font-[Inter,sans-serif] hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 'filling_form' && (
          <div className="max-h-[65vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide font-[Inter,sans-serif] mb-1">
                  Spot name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nakholmen South"
                  required
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 placeholder-stone-400 font-[Inter,sans-serif] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide font-[Inter,sans-serif] mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the site, depths, marine life..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 placeholder-stone-400 font-[Inter,sans-serif] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide font-[Inter,sans-serif] mb-1">
                  Access info
                </label>
                <input
                  type="text"
                  value={accessInfo}
                  onChange={(e) => setAccessInfo(e.target.value)}
                  placeholder="How to get there, entry point..."
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 placeholder-stone-400 font-[Inter,sans-serif] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Photos section */}
              <div className="pt-1">
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide font-[Inter,sans-serif] mb-2">
                  Photos
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.map((url) => (
                    <div key={url} className="relative flex-shrink-0 w-20 h-20">
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover rounded-lg border border-stone-200 dark:border-stone-700"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(url)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-stone-800/80 text-white text-xs flex items-center justify-center hover:bg-stone-900 transition-colors leading-none"
                        aria-label="Remove photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 w-20 h-20 rounded-lg border border-dashed border-stone-300 dark:border-stone-600 flex flex-col items-center justify-center gap-1 text-stone-400 dark:text-stone-500 hover:border-emerald-400 hover:text-emerald-500 dark:hover:border-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    aria-label="Add photos"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                    <span className="text-xs font-[Inter,sans-serif]">Add</span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePhotoFiles(e.target.files)}
                />
              </div>

              {/* Parking section */}
              <div className="pt-1">
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide font-[Inter,sans-serif] mb-2">
                  Parking Locations
                </p>
                {parkings.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {parkings.map((p, i) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg"
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400 text-xs font-bold font-[Inter,sans-serif] flex items-center justify-center">
                          P
                        </span>
                        <span className="flex-1 text-sm text-stone-700 dark:text-stone-300 font-[Inter,sans-serif] truncate">
                          {p.description || `Parking location ${i + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveParking(p.id)}
                          className="flex-shrink-0 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors text-base leading-none"
                          aria-label="Remove parking location"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setStep('placing_parking')}
                  className="w-full py-2 text-sm font-medium text-teal-600 dark:text-teal-400 font-[Inter,sans-serif] border border-dashed border-teal-400 dark:border-teal-600 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                >
                  + Add Parking Location
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold font-[Inter,sans-serif] rounded-xl transition-colors shadow-lg"
              >
                Create Dive Spot
              </button>
            </form>
            <div className="flex justify-center mt-3">
              <button
                type="button"
                onClick={onCancel}
                className="text-sm text-stone-500 dark:text-stone-400 font-[Inter,sans-serif] hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'placing_parking' && (
          <>
            <input
              type="text"
              value={parkingDescription}
              onChange={(e) => setParkingDescription(e.target.value)}
              placeholder="e.g. Free parking, 5 min walk"
              className="w-full px-3 py-2 mb-3 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 placeholder-stone-400 font-[Inter,sans-serif] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddParking}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-sm font-semibold font-[Inter,sans-serif] rounded-xl transition-colors shadow-lg"
            >
              Add Parking Location
            </button>
            <div className="flex justify-center mt-3">
              <button
                type="button"
                onClick={() => setStep('filling_form')}
                className="text-sm text-stone-500 dark:text-stone-400 font-[Inter,sans-serif] hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
