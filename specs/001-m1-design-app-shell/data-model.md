# Data Model: M1 — Design System & App Shell

**Date**: 2026-02-23

---

## Overview

M1 introduces no database schema changes. The "data model" for this milestone is the design token system — a set of typed TypeScript constants that define colors and typography across the app.

---

## Token Structures

### Color Token (`src/shared/theme/colors.ts`)

```typescript
type ColorScale = {
  50: string;
  100: string;
  // ... keyed by shade
};

type Colors = {
  primary: ColorScale;    // Emerald
  secondary: ColorScale;  // Teal
  neutral: ColorScale;    // Stone
};
```

**Primary (Emerald)** — Buttons, CTAs, active states, FAB:

| Token | Hex |
|-------|-----|
| `colors.primary[50]` | `#ecfdf5` |
| `colors.primary[100]` | `#d1fae5` |
| `colors.primary[400]` | `#34d399` |
| `colors.primary[500]` | `#10b981` |
| `colors.primary[600]` | `#059669` |
| `colors.primary[700]` | `#047857` |

**Secondary (Teal)** — Secondary actions, visibility badges, parking markers:

| Token | Hex |
|-------|-----|
| `colors.secondary[50]` | `#f0fdfa` |
| `colors.secondary[100]` | `#ccfbf1` |
| `colors.secondary[400]` | `#2dd4bf` |
| `colors.secondary[500]` | `#14b8a6` |
| `colors.secondary[600]` | `#0d9488` |
| `colors.secondary[700]` | `#0f766e` |

**Neutral (Stone)** — Backgrounds, text, borders, frosted glass:

| Token | Hex |
|-------|-----|
| `colors.neutral[50]` | `#fafaf9` |
| `colors.neutral[100]` | `#f5f5f4` |
| `colors.neutral[200]` | `#e7e5e4` |
| `colors.neutral[300]` | `#d6d3d1` |
| `colors.neutral[400]` | `#a8a29e` |
| `colors.neutral[500]` | `#78716c` |
| `colors.neutral[600]` | `#57534e` |
| `colors.neutral[700]` | `#44403c` |
| `colors.neutral[800]` | `#292524` |
| `colors.neutral[900]` | `#1c1917` |
| `colors.neutral[950]` | `#0c0a09` |

---

### Typography Token (`src/shared/theme/typography.ts`)

```typescript
import { TextStyle } from 'react-native';

type TypographyVariant = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'fontWeight' | 'lineHeight'>;

type Typography = {
  [variant: string]: TypographyVariant;
};
```

**Variants:**

| Key | Font | Weight | Size | Line Height | Usage |
|-----|------|--------|------|-------------|-------|
| `h1` | SpaceGrotesk | 700 | 32 | 40 | Screen titles |
| `h2` | SpaceGrotesk | 600 | 28 | 34 | Section headers |
| `h3` | SpaceGrotesk | 500 | 24 | 30 | Subsection headers |
| `body` | Inter | 400 | 16 | 24 | General body text |
| `bodySmall` | Inter | 400 | 14 | 20 | Labels, captions |
| `bodyBold` | Inter | 700 | 16 | 24 | Emphasized body |
| `mono` | IBMPlexMono | 400 | 14 | 20 | Visibility data |
| `monoBold` | IBMPlexMono | 500 | 14 | 20 | Key numeric values |

**Fallback variants** (system fonts, used if font loading fails):
- All `fontFamily` values replace with `'System'` (heading/body) or `'Courier New'` (mono).

---

### Font Assets (`assets/fonts/`)

| File | Family | Weight | Role |
|------|--------|--------|------|
| `SpaceGrotesk-Regular.ttf` | Space Grotesk | 400 | Heading |
| `SpaceGrotesk-Medium.ttf` | Space Grotesk | 500 | Heading |
| `SpaceGrotesk-SemiBold.ttf` | Space Grotesk | 600 | Heading |
| `SpaceGrotesk-Bold.ttf` | Space Grotesk | 700 | Heading |
| `Inter-Regular.ttf` | Inter | 400 | Body |
| `Inter-Medium.ttf` | Inter | 500 | Body |
| `Inter-SemiBold.ttf` | Inter | 600 | Body |
| `Inter-Bold.ttf` | Inter | 700 | Body |
| `IBMPlexMono-Regular.ttf` | IBM Plex Mono | 400 | Data |
| `IBMPlexMono-Medium.ttf` | IBM Plex Mono | 500 | Data |

Font name keys (registered via `useFonts`):
`SpaceGrotesk-400`, `SpaceGrotesk-500`, `SpaceGrotesk-600`, `SpaceGrotesk-700`,
`Inter-400`, `Inter-500`, `Inter-600`, `Inter-700`,
`IBMPlexMono-400`, `IBMPlexMono-500`

---

## Component Contracts

### `FrostedGlass` component (`src/shared/components/FrostedGlass.tsx`)

```typescript
type FrostedGlassProps = {
  children: React.ReactNode;
  style?: ViewStyle;          // Optional layout overrides (no internal layout assumptions)
  intensity?: number;         // Blur intensity 1–100, default: 70
};
```

**Constraints**:
- Component makes no layout assumptions — it fills whatever space its parent gives it.
- Applies `overflow: 'hidden'` internally (required for border radius to work with BlurView).
- `style` overrides are applied to the outer wrapper, not the BlurView directly.

---

### `CustomTabBar` component (`src/shared/components/CustomTabBar.tsx`)

```typescript
// Accepts standard React Navigation tab bar props
type CustomTabBarProps = BottomTabBarProps; // from @react-navigation/bottom-tabs
```

**Constraints**:
- Must call `navigation.emit({ type: 'tabPress', target: route.key })` to preserve React Navigation's event system.
- Must render `accessibilityRole="button"` and `accessibilityState` on each tab button.
- Active icon color: `colors.primary[500]` (`#10b981`). Inactive: `colors.neutral[500]` (`#78716c`).
- Bottom padding: `Math.max(insets.bottom, 12)` — never zero.

---

## No Database Schema Changes

M1 is entirely client-side. No Prisma migrations, no backend changes, no new API endpoints.
