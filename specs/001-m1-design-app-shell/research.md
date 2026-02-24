# Research: M1 — Design System & App Shell

**Date**: 2026-02-23
**Branch**: `001-m1-design-app-shell`

---

## Decision Log

### D-001: Profile Layer — How to keep map mounted while profile is visible

**Decision**: Add `unmountOnBlur: false` to `Tabs` screenOptions in `(tabs)/_layout.tsx`. The Profile tab screen renders as a full-screen animated overlay using `react-native-reanimated` (already installed at v4.1.1).

**Rationale**:
- Single config change keeps the map mounted; no custom navigator required.
- `react-native-reanimated` is already installed — no new dependency.
- The profile screen becomes a self-contained animated component that slides in and fills the screen.
- Alternatives rejected:
  - **`@gorhom/bottom-sheet` at 100% snap** — would work but adds gesture conflict risk with the existing SpotDetailSheet and overloads a bottom-sheet pattern for a full-page view.
  - **Custom overlay outside Expo Router** — breaks file-based routing conventions; requires manual tab press interception.
  - **Modal group `(modal)/`** — creates a new route history entry; back gesture conflicts with tab switching.

**Implementation note**: ProfileOverlayScreen uses `useAnimatedStyle` + `withTiming` from reanimated to slide up from the bottom on mount. The screen uses `StyleSheet.absoluteFillObject` + `zIndex: 10` so it fills the display above the always-mounted map.

**Files touched**:
- `app/(app)/(tabs)/_layout.tsx` — add `unmountOnBlur: false`
- `src/features/auth/screens/profile-screen.tsx` — rewrite as animated overlay

---

### D-002: Font Loading — Strategy and splash screen behavior

**Decision**: Use local `.ttf` files loaded via `expo-font` (`useFonts` hook). Keep the existing `SplashScreen.preventAutoHideAsync()` pattern already in `_layout.tsx`. Expand font list from `SpaceMono` to all three required families.

**Rationale**:
- `expo-font` is already installed (v14.0.11). `SplashScreen.preventAutoHideAsync()` is already called at module level in `_layout.tsx` — the pattern is correct and just needs expansion.
- Local files vs `@expo-google-fonts` packages: local is preferred for offline capability, bundle predictability, and faster cold start (no network fetch). The project's only existing font (`SpaceMono-Regular.ttf`) uses local files — this is consistent.
- Graceful failure: in the `useEffect` that watches `[loaded, error]`, always call `SplashScreen.hideAsync()` even on error, then use system-font fallbacks. App must never hang at splash.

**Font naming convention**: `FontFamily-Weight` (e.g., `SpaceGrotesk-700`, `Inter-400`, `IBMPlexMono-400`).

**Files touched**:
- `assets/fonts/` — add 10 `.ttf` files (4 Space Grotesk, 4 Inter, 2 IBM Plex Mono)
- `app/_layout.tsx` — expand `useFonts` map; update error handling
- `src/shared/theme/typography.ts` — new file; maps role-based styles to font names

---

### D-003: expo-blur — Installation and Android behavior

**Decision**: Install `expo-blur` via `npx expo install expo-blur`. Use `BlurView` with `intensity={70}`, `tint="light"` (light mode only in M1), and `experimentalBlurMethod="dimezisBlurView"` for Android native blur.

**Rationale**:
- `expo-blur` is not currently installed. `npx expo install` (not `npm install`) is required for managed workflow compatibility — it pins to the SDK-compatible version.
- Android: `experimentalBlurMethod="dimezisBlurView"` enables native blur on Android. Without it, Android renders a solid overlay with no blur. Both behaviors meet the FR-007 requirement (semi-transparent fallback acceptable).
- Dark mode is out of scope for M1 — `tint="light"` is sufficient.
- **Critical layout note**: wrap `BlurView` in a `<View style={{ overflow: 'hidden' }}>` to apply `borderRadius` correctly (BlurView ignores `borderRadius` directly).

**Files created**:
- `src/shared/components/FrostedGlass.tsx` — reusable component

---

### D-004: Custom Tab Bar — Approach and API

**Decision**: Use the `tabBar` prop on `Tabs` screenOptions to inject a `CustomTabBar` component. `useSafeAreaInsets()` from `react-native-safe-area-context` (already installed v5.6.0) provides iOS home indicator padding.

**Rationale**:
- `tabBar` prop is the standard React Navigation / Expo Router v6 approach for replacing the default tab bar. It passes `state`, `descriptors`, and `navigation` — all needed for route detection and navigation.
- `@expo/vector-icons` (v15.0.3, already installed) provides the FontAwesome icon set already in use; keeping the same icon library avoids a new dependency.
- `useSafeAreaInsets()` returns the device-specific safe area values. On iOS, `insets.bottom` includes the home indicator space (~34pt on modern iPhones). Use `Math.max(insets.bottom, 12)` as minimum padding.
- Active color: `emerald-500` (`#10b981`); inactive color: `stone-500` (`#78716c`). These must be consumed from the design token file (FR-003).
- `navigation.emit({ type: 'tabPress' })` is the correct way to trigger tab press events in a custom tab bar (avoids bypassing React Navigation's event system).

**Files touched**:
- `app/(app)/(tabs)/_layout.tsx` — add `tabBar` prop, import `CustomTabBar`
- `src/shared/components/CustomTabBar.tsx` — new file

---

### D-005: Design Token File Structure

**Decision**: Replace `src/shared/theme/Colors.ts` with two files: `colors.ts` (Emerald/Teal/Stone palettes) and `typography.ts` (role-based text styles). Both exported from `src/shared/theme/index.ts`.

**Rationale**:
- Splitting colors and typography matches the separation in `docs/UI_DESIGN.md` (§1 "Colors" and "Typography" are separate subsections).
- A barrel `index.ts` allows `import { colors, typography } from '@/src/shared/theme'` — cleaner than per-file imports.
- The existing `Colors.ts` uses a nested `{ light: {}, dark: {} }` object that doesn't match the token structure needed. A clean replacement (not augmentation) is required per FR-004 and Clarification Q1.

**Files created**:
- `src/shared/theme/colors.ts`
- `src/shared/theme/typography.ts`
- `src/shared/theme/index.ts`
- *(delete)* `src/shared/theme/Colors.ts`

---

### D-006: FrostedGlass Token Values

**Decision**: Hardcode the specific frosted glass values as constants (not imported from token file), because they are not general-purpose color tokens — they are composite style recipes.

Frosted glass constants (light mode only for M1):
```
background: 'rgba(255, 255, 255, 0.8)'
blur intensity: 70 (≈ blur(12) in CSS)
border color: 'rgba(231, 229, 228, 0.6)'  — stone-200 @ 60%
```

**Rationale**: Frosted glass is a visual pattern, not a raw color. Keeping its values inside `FrostedGlass.tsx` as constants prevents misuse (e.g., someone accidentally using the semi-transparent white as a solid background).

---

## Existing Assets Confirmed Ready

| Asset | Status | Notes |
|-------|--------|-------|
| `react-native-reanimated` | ✅ v4.1.1 | Profile layer animation |
| `react-native-safe-area-context` | ✅ v5.6.0 | Tab bar insets |
| `expo-font` | ✅ v14.0.11 | Font loading |
| `expo-splash-screen` | ✅ v31.0.13 | Splash gate pattern |
| `@expo/vector-icons` | ✅ v15.0.3 | Tab icons |
| `SplashScreen.preventAutoHideAsync()` | ✅ Already in `_layout.tsx` | Pattern just needs expansion |
| `assets/fonts/` directory | ✅ Exists | Add new font .ttf files here |
| `src/shared/theme/` directory | ✅ Exists | Replace Colors.ts |

## New Dependency Required

| Package | Install Command | Reason |
|---------|-----------------|--------|
| `expo-blur` | `npx expo install expo-blur` | FrostedGlass BlurView |
| Font .ttf files | Downloaded from Google Fonts / IBM GitHub | Space Grotesk, Inter, IBM Plex Mono |
