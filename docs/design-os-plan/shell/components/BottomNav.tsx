import React from 'react'
import { Map, User } from 'lucide-react'
import type { NavItem } from './AppShell'

const iconMap: Record<string, React.ElementType> = {
  map: Map,
  profile: User,
}

interface BottomNavProps {
  items: NavItem[]
  onNavigate?: (item: NavItem) => void
}

export function BottomNav({ items, onNavigate }: BottomNavProps) {
  return (
    <nav
      className="
        flex items-center justify-around
        bg-white/80 dark:bg-stone-900/85
        backdrop-blur-md
        border-t border-stone-200/60 dark:border-stone-700/60
        px-2
        pb-safe
      "
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Main navigation"
    >
      {items.map((item) => {
        const Icon = iconMap[item.id] ?? Map
        return (
          <button
            key={item.id}
            onClick={() => onNavigate?.(item)}
            className={`
              flex flex-col items-center gap-0.5
              py-3 px-5
              min-w-0 flex-1
              transition-colors duration-150
              ${item.isActive
                ? 'text-emerald-500 dark:text-emerald-400'
                : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              }
            `}
            aria-current={item.isActive ? 'page' : undefined}
          >
            <Icon
              size={22}
              strokeWidth={item.isActive ? 2.5 : 1.75}
              aria-hidden="true"
            />
            <span
              className={`
                text-[10px] tracking-wide font-medium
                font-[Inter,sans-serif]
                ${item.isActive ? 'text-emerald-500 dark:text-emerald-400' : ''}
              `}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
