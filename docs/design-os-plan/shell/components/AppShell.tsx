import React from 'react'
import { BottomNav } from './BottomNav'
import { SearchBar } from './SearchBar'

export interface NavItem {
  id: string
  label: string
  href: string
  isActive?: boolean
}

export interface AppShellProps {
  /** The map component — rendered as the fullscreen base layer */
  mapContent?: React.ReactNode
  /** Page content rendered above the map (z-10) but below nav and overlays — use for full-page views like profile */
  pageContent?: React.ReactNode
  /** Overlay content (spot detail sheets, forms, etc.) rendered above the map */
  children?: React.ReactNode
  navigationItems: NavItem[]
  searchValue?: string
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
  onSearchSubmit?: (value: string) => void
  onNavigate?: (item: NavItem) => void
}

export function AppShell({
  mapContent,
  pageContent,
  children,
  navigationItems,
  searchValue = '',
  searchPlaceholder = 'Search dive spots...',
  onSearchChange,
  onSearchSubmit,
  onNavigate,
}: AppShellProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-sky-100 dark:bg-slate-900">
      {/* Map layer — fills entire screen */}
      <div className="absolute inset-0 z-0">
        {mapContent ?? (
          <div className="w-full h-full bg-gradient-to-b from-sky-200 to-sky-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
            <span className="text-stone-400 text-sm font-mono">Map renders here</span>
          </div>
        )}
      </div>

      {/* Page content — full-page views (e.g. profile), above map, below nav */}
      {pageContent && (
        <div className="absolute inset-x-0 top-0 bottom-0 z-10 overflow-y-auto pb-14">
          {pageContent}
        </div>
      )}

      {/* Floating search bar — hidden when pageContent is active */}
      {!pageContent && (
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12">
          <SearchBar
            value={searchValue}
            placeholder={searchPlaceholder}
            onChange={onSearchChange}
            onSubmit={onSearchSubmit}
          />
        </div>
      )}

      {/* Content overlay (detail sheets, modals) */}
      {children && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          <div className="pointer-events-auto">{children}</div>
        </div>
      )}

      {/* Bottom tab bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <BottomNav items={navigationItems} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
