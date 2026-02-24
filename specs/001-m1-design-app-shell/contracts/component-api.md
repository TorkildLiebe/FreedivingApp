# Component API Contracts: M1 — Design System & App Shell

These contracts define the public API surface that M2–M4 milestones will consume. Changes to these interfaces after M1 ship constitute breaking changes.

---

## Token Exports (`src/shared/theme/index.ts`)

```typescript
// Barrel export — canonical import path for all tokens
export { colors } from './colors';
export { typography } from './typography';
```

**Usage in M2+:**
```typescript
import { colors, typography } from '@/src/shared/theme';
```

---

## `colors` object

```typescript
// Shape guarantee
const colors: {
  primary: Record<50 | 100 | 400 | 500 | 600 | 700, string>;
  secondary: Record<50 | 100 | 400 | 500 | 600 | 700, string>;
  neutral: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950, string>;
};

// Example access
colors.primary[500]   // #10b981 — emerald-500 (primary CTA)
colors.neutral[200]   // #e7e5e4 — stone-200 (frosted glass border)
```

---

## `typography` object

```typescript
// Shape guarantee
const typography: {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  body: TextStyle;
  bodySmall: TextStyle;
  bodyBold: TextStyle;
  mono: TextStyle;
  monoBold: TextStyle;
};

// Usage
<Text style={typography.h1}>Spot Name</Text>
<Text style={typography.mono}>12.5m</Text>
```

---

## `FrostedGlass` component

```typescript
import { FrostedGlass } from '@/src/shared/components/FrostedGlass';

// Props contract
type FrostedGlassProps = {
  children: React.ReactNode;
  style?: ViewStyle;    // Layout overrides; no internal layout assumptions
  intensity?: number;   // 1–100, default 70
};

// Usage
<FrostedGlass style={{ height: 64 }}>
  <Text>Tab label</Text>
</FrostedGlass>
```

**Guarantees**:
- Renders correctly on iOS (native blur) and Android (blur or semi-transparent fallback).
- `overflow: 'hidden'` is always applied — border radius works correctly via the wrapper.
- Makes no assumptions about height, width, position, or children layout.
- WCAG AA compliant — text rendered as direct children maintains ≥ 4.5:1 contrast ratio.

---

## App Shell Layer Contract (z-index conventions)

M2+ components must respect these layer values:

| Layer | z-index | Contents |
|-------|---------|----------|
| Map | 0 | MapLibre GL view (always mounted) |
| Profile page | 10 | Full-page profile overlay |
| Search bar + Tab bar | 20 | Floating controls |
| Overlay content | 30 | Bottom sheets, modals, forms |

**Invariant**: The map MUST remain mounted at all times. No component may unmount or re-initialize it.
