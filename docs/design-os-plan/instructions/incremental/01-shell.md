# Milestone 1: Shell

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** None

---

## About This Handoff

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Product requirements and user flow specifications
- Design system tokens (colors, typography)
- Sample data showing the shape of data components expect
- Test specs focused on user-facing behavior

**Your job:**
- Integrate these components into your application
- Wire up callback props to your routing and business logic
- Replace sample data with real data from your backend
- Implement loading, error, and empty states

The components are props-based — they accept data and fire callbacks. How you architect the backend, data layer, and business logic is up to you.

---

## Goal

Set up the design tokens and application shell — the persistent chrome that wraps all sections.

## What to Implement

### 1. Design Tokens

Configure your styling system with these tokens:

- See `docs/design-os-plan/design-system/tokens.css` for CSS custom properties
- See `docs/design-os-plan/design-system/tailwind-colors.md` for Tailwind color usage
- See `docs/design-os-plan/design-system/fonts.md` for Google Fonts setup

**Key choices:**
- Primary: `emerald` (buttons, active states, CTAs)
- Secondary: `teal` (secondary actions, visibility badges)
- Neutral: `stone` (backgrounds, text, borders)
- Heading font: Space Grotesk
- Body font: Inter
- Mono font: IBM Plex Mono

**Dependency:**
```bash
npm install lucide-react
```

### 2. Application Shell

Copy the shell components from `docs/design-os-plan/shell/components/` to your project:

- `AppShell.tsx` — Main layout wrapper (fullscreen map + floating UI layers)
- `BottomNav.tsx` — Frosted glass bottom tab bar with safe-area insets
- `SearchBar.tsx` — Floating frosted glass search input

**Wire Up Navigation:**

The shell expects two navigation items:

```tsx
const navItems = [
  { id: 'map', label: 'Map', href: '/', isActive: currentRoute === '/' },
  { id: 'profile', label: 'Profile', href: '/profile', isActive: currentRoute === '/profile' },
]

<AppShell
  mapContent={<YourMapComponent />}
  navigationItems={navItems}
  onNavigate={(item) => router.push(item.href)}
  searchValue={searchQuery}
  onSearchChange={setSearchQuery}
  onSearchSubmit={handleSearch}
>
  {/* Overlays (detail sheets, forms) go here */}
</AppShell>
```

**For profile pages:** Pass the profile page as `pageContent` to render it above the map but below the nav:

```tsx
<AppShell
  mapContent={<YourMapComponent />}
  pageContent={currentRoute === '/profile' ? <ProfilePage {...profileProps} /> : undefined}
  navigationItems={navItems}
  onNavigate={...}
/>
```

**Map integration:** The shell accepts any map component via `mapContent`. Integrate your chosen map library (Leaflet, Mapbox, Google Maps, etc.) there. The `onSearch` prop from `MapAndSpots` should filter spot markers on the map.

**Visual reference:** See `docs/design-os-plan/shell/screenshot.png`

## Files to Reference

- `docs/design-os-plan/design-system/` — Design tokens
- `docs/design-os-plan/shell/README.md` — Shell design intent
- `docs/design-os-plan/shell/components/` — Shell React components

## Done When

- [ ] Design tokens are configured (colors and fonts)
- [ ] Shell renders with the fullscreen map base layer
- [ ] Bottom tab bar shows Map and Profile tabs
- [ ] Navigation switches between Map and Profile views
- [ ] Search bar is visible on the map view
- [ ] Profile page renders via `pageContent` (no search bar shown)
- [ ] Safe area insets applied on iOS (bottom nav)
