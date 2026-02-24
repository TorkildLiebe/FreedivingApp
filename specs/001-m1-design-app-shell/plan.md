# Implementation Plan: M1 — Design System & App Shell

**Branch**: `001-m1-design-app-shell` | **Date**: 2026-02-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-m1-design-app-shell/spec.md`

---

## Summary

Establish the visual foundation of DiveFreely's mobile app: a typed design token system (colors + typography), a reusable `FrostedGlass` component, a styled bottom tab bar, a floating map search bar, and a profile page that overlays the map without unmounting it.

The key architectural insight is that `unmountOnBlur: false` on the Tabs navigator — a single line change — keeps the MapLibre map mounted while the Profile tab is visible, avoiding expensive re-initialization and preserving camera state. All new visual components consume tokens from `src/shared/theme/`, replacing the existing `Colors.ts`.

---

## Technical Context

**Language/Version**: TypeScript (strict)
**Primary Dependencies**:
- `expo-router ~6.0.23` (file-based navigation)
- `react-native-reanimated ~4.1.1` (profile layer slide animation)
- `expo-blur` (**to install** via `npx expo install expo-blur` — FrostedGlass)
- `expo-font ~14.0.11` (font loading)
- `expo-splash-screen ~31.0.13` (splash gate)
- `react-native-safe-area-context ~5.6.0` (tab bar insets)
- `@expo/vector-icons ~15.0.3` (tab icons)

**Storage**: N/A — no database changes in M1
**Testing**: Jest + React Native Testing Library; visual verification via iOS Simulator + Android Emulator
**Target Platform**: iOS 15+, Android 8+
**Project Type**: Mobile app (Expo managed workflow, iOS + Android only)
**Performance Goals**: Profile layer animation ≤ 300ms (SC-004); search filter ≤ perceptible lag at 500 markers (SC-005)
**Constraints**: WCAG AA contrast (4.5:1) over frosted glass; no dark mode in M1; no backend changes

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Domain Independence** | ✅ PASS | M1 is pure mobile UI. No domain code, no backend imports, no repository patterns needed. |
| **II. Vertical Slice Architecture** | ✅ PASS | Tokens in `src/shared/theme/` (shared utilities). FrostedGlass/CustomTabBar in `src/shared/components/` (shared UI primitives). Profile screen stays in `src/features/auth/screens/`. Dependency direction preserved: `app/*` → `src/features/*` → `src/shared/*`. |
| **III. Security & Auth First** | ✅ N/A | No auth or data write operations in M1. |
| **IV. Data Integrity** | ✅ N/A | No database schema changes. No entity mutations. |
| **V. Test-Driven Quality** | ⚠️ PLAN | Token correctness and FrostedGlass rendering require visual/component tests. Unit tests for token values. Snapshot tests for CustomTabBar and FrostedGlass. Profile overlay mount test (map stays mounted). |
| **VI. Mobile-First, Minimal Complexity** | ✅ PASS | WCAG AA enforced (FR-008, SC-006). Animation target ≤ 300ms. No microservices, no web target. `unmountOnBlur: false` adds minimal memory overhead (2 tabs always in memory). |

**Post-design re-check (Phase 1)**: All principles hold. No violations. `Complexity Tracking` table not required.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-m1-design-app-shell/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research decisions
├── data-model.md        # Token structures and component contracts
├── quickstart.md        # Verification guide
├── contracts/
│   └── component-api.md # Public API surface for M2+ consumption
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
apps/mobile/
├── assets/
│   └── fonts/
│       ├── SpaceGrotesk-Regular.ttf      # NEW — weight 400
│       ├── SpaceGrotesk-Medium.ttf       # NEW — weight 500
│       ├── SpaceGrotesk-SemiBold.ttf     # NEW — weight 600
│       ├── SpaceGrotesk-Bold.ttf         # NEW — weight 700
│       ├── Inter-Regular.ttf             # NEW — weight 400
│       ├── Inter-Medium.ttf              # NEW — weight 500
│       ├── Inter-SemiBold.ttf            # NEW — weight 600
│       ├── Inter-Bold.ttf                # NEW — weight 700
│       ├── IBMPlexMono-Regular.ttf       # NEW — weight 400
│       └── IBMPlexMono-Medium.ttf        # NEW — weight 500
├── app/
│   ├── _layout.tsx                       # MODIFY — expand useFonts, graceful fallback
│   └── (app)/
│       └── (tabs)/
│           ├── _layout.tsx               # MODIFY — unmountOnBlur:false, tabBar prop
│           └── profile.tsx               # MODIFY — import ProfileOverlayScreen
└── src/
    ├── shared/
    │   ├── theme/
    │   │   ├── colors.ts                 # NEW — replaces Colors.ts
    │   │   ├── typography.ts             # NEW
    │   │   └── index.ts                  # NEW — barrel export
    │   │   (Colors.ts)                   # DELETE
    │   └── components/
    │       ├── FrostedGlass.tsx          # NEW
    │       └── CustomTabBar.tsx          # NEW
    └── features/
        ├── map/
        │   └── screens/
        │       └── map-screen.tsx        # MODIFY — add floating search bar
        └── auth/
            └── screens/
                └── profile-screen.tsx    # MODIFY — rewrite as animated overlay
```

**Structure Decision**: Mobile-only app (Option 3 pattern). No backend or shared-package changes. All new code stays in `apps/mobile/`.

---

## Implementation Sequence

### Step 1: Install expo-blur and add font assets
*Prerequisite for everything else.*
- `npx expo install expo-blur` (from `apps/mobile/`)
- Download and place 10 `.ttf` files in `assets/fonts/`

### Step 2: Define design tokens (#67)
*All other components depend on these.*
- Create `src/shared/theme/colors.ts` — typed Emerald/Teal/Stone palette
- Create `src/shared/theme/typography.ts` — role-based text styles + fallbacks
- Create `src/shared/theme/index.ts` — barrel export
- Delete `src/shared/theme/Colors.ts`
- Update `app/_layout.tsx` — expand `useFonts` to load all 10 fonts; add graceful fallback path in `useEffect`

### Step 3: Build FrostedGlass component (#68)
*Depends on tokens being defined (Step 2) for border/background values.*
- Create `src/shared/components/FrostedGlass.tsx`
- Props: `children`, `style?`, `intensity?` (default 70)
- Internal: `BlurView` wrapped in `<View style={{ overflow: 'hidden' }}>` for border radius
- Android: `experimentalBlurMethod="dimezisBlurView"`

### Step 4: Style tab bar with icons and safe area insets (#69)
*Depends on FrostedGlass (Step 3) and tokens (Step 2).*
- Create `src/shared/components/CustomTabBar.tsx`
- Uses `FrostedGlass` as background, `useSafeAreaInsets()` for bottom padding
- Map icon: `FontAwesome "map"`; Profile icon: `FontAwesome "user"`
- Active color: `colors.primary[500]`; inactive: `colors.neutral[500]`
- Modify `app/(app)/(tabs)/_layout.tsx` — add `tabBar` prop, add `unmountOnBlur: false`

### Step 5: Add floating search bar (#70)
*Depends on FrostedGlass (Step 3) and tokens (Step 2).*
- Modify `src/features/map/screens/map-screen.tsx` — add `TextInput` wrapped in `FrostedGlass`, positioned at `zIndex: 20`, near top
- Client-side filter: `useState` for query string; filter the already-fetched spots array by `spot.title.toLowerCase().includes(query.toLowerCase())`
- Clearing input → pass full spots array to map markers

### Step 6: Profile overlay (#71)
*Depends on tab layout change (Step 4) for `unmountOnBlur: false`.*
- Modify `src/features/auth/screens/profile-screen.tsx` — add slide-up animation via `useAnimatedStyle` + `withTiming` from reanimated
- `StyleSheet.absoluteFillObject` + `zIndex: 10` + slide in from `translateY: screenHeight → 0`
- Placeholder content: centered text "Profile coming in M4"

---

## Testing Plan

| Test | Type | Scope |
|------|------|-------|
| Token values match `docs/UI_DESIGN.md` spec | Unit | `src/shared/theme/colors.ts`, `typography.ts` |
| No raw hex values in M1 component files | Lint / grep | All new/modified files |
| FrostedGlass renders children without layout distortion | Snapshot | `FrostedGlass.tsx` |
| CustomTabBar renders correct icons and colors | Snapshot | `CustomTabBar.tsx` |
| Map stays mounted when Profile tab is active | Component test | Tab layout + map-screen |
| Profile overlay translates from screenHeight to 0 | Unit | profile-screen animation |
| Search filter: partial match, case-insensitive, clear restores | Unit | map-screen search logic |
| Font loading: splash held until fonts ready | Integration | `_layout.tsx` |
| Font load error: app renders with system fonts (no hang) | Integration | `_layout.tsx` error path |

---

## Verification

See [quickstart.md](./quickstart.md) for step-by-step verification.

**Critical checks before declaring complete**:
1. `grep` for raw hex values — must return zero matches in M1 files
2. iOS Simulator screenshot: tab bar, search bar, profile layer
3. Android emulator screenshot: frosted glass fallback, tab bar
4. Tab switch test: map position preserved after Profile → Map navigation
