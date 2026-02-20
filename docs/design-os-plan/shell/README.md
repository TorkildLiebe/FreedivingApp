# Application Shell

## Overview

Freedive App uses a fullscreen map-first shell. The map occupies the entire screen at all times. UI chrome floats on top of the map using frosted glass panels — never blocking the map with an opaque layout. There is no persistent header; navigation happens through a bottom tab bar.

## Navigation Structure

- **Map** (home/default) → Map & Spots section
- **Profile** → Auth & Profiles section (Favorites accessible as a tab within the profile screen)

## Components Provided

- `AppShell` — Main layout wrapper. Accepts `mapContent`, `pageContent`, `children`, and navigation props.
- `BottomNav` — Bottom tab bar with frosted glass styling and safe-area insets for iOS.
- `SearchBar` — Floating frosted-glass search input, shown only in the map view (hidden when pageContent is active).

## Wire Up Navigation

The shell expects a `navigationItems` array:

```tsx
const navItems = [
  { id: 'map', label: 'Map', href: '/', isActive: currentRoute === '/' },
  { id: 'profile', label: 'Profile', href: '/profile', isActive: currentRoute === '/profile' },
]
```

Connect `onNavigate` to your router's navigation function.

## Layout Layers (z-index)

| Layer | z-index | Content |
|-------|---------|---------|
| Map | 0 | Fullscreen map tile layer |
| Page content | 10 | Full-page views (profile page) |
| Search bar | 20 | Floating search bar (top) |
| Overlay content | 30 | Detail sheets, modals, forms |
| Bottom nav | 20 | Bottom tab bar (always on top) |

## Dependencies

The shell uses `lucide-react` for tab bar icons (Map and User icons). Install it in your project:

```bash
npm install lucide-react
```

## Visual Reference

See `screenshot.png` for the shell design.
