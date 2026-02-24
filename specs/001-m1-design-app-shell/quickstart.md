# Quickstart & Verification: M1 — Design System & App Shell

**Branch**: `001-m1-design-app-shell`

Use this guide to verify the M1 implementation is complete and correct.

---

## Setup

```bash
# Install new dependency
cd apps/mobile
npx expo install expo-blur

# Return to root and start
cd ../..
pnpm run dev:mobile   # or: cd apps/mobile && npx expo start
```

---

## Font Asset Checklist

Before starting the iOS/Android simulator, verify these files exist:

```bash
ls apps/mobile/assets/fonts/
# Expected:
# SpaceGrotesk-Regular.ttf
# SpaceGrotesk-Medium.ttf
# SpaceGrotesk-SemiBold.ttf
# SpaceGrotesk-Bold.ttf
# Inter-Regular.ttf
# Inter-Medium.ttf
# Inter-SemiBold.ttf
# Inter-Bold.ttf
# IBMPlexMono-Regular.ttf
# IBMPlexMono-Medium.ttf
```

Font sources:
- Space Grotesk: https://fonts.google.com/specimen/Space+Grotesk
- Inter: https://fonts.google.com/specimen/Inter
- IBM Plex Mono: https://github.com/IBM/plex/tree/master/packages/ibm-plex-mono/fonts/complete/ttf

---

## Verification Steps

### 1. Token integrity check (no raw values in M1 component files)

```bash
# Should return zero matches (raw hex values in component files)
grep -rn '#[0-9a-fA-F]\{6\}' apps/mobile/src/features/auth/screens/profile-screen.tsx
grep -rn '#[0-9a-fA-F]\{6\}' apps/mobile/src/shared/components/FrostedGlass.tsx
grep -rn '#[0-9a-fA-F]\{6\}' apps/mobile/src/shared/components/CustomTabBar.tsx
grep -rn '"SpaceGrotesk\|"Inter\|"IBMPlexMono' apps/mobile/src/

# Colors.ts should no longer exist
ls apps/mobile/src/shared/theme/
# Expected: colors.ts  typography.ts  index.ts
```

### 2. App launches and stays on splash until fonts load

Open the app in Expo Go or a simulator. The splash screen should hold for a brief moment, then dismiss — the app renders immediately with correct fonts (no FOUT visible).

### 3. Tab bar appearance (iOS + Android)

Verify visually:
- [ ] Tab bar has frosted glass background (blurred/translucent on iOS; semi-transparent on Android)
- [ ] Map tab: map pin icon; Profile tab: person icon
- [ ] Active tab icon is emerald green; inactive is stone/grey
- [ ] Tab bar does not overlap the iOS home indicator (swipe up area is clear)
- [ ] Tab bar does not overlap Android gesture navigation bar

### 4. Search bar (map view)

- [ ] Floating frosted glass input appears near the top of the map screen
- [ ] Typing filters spot markers in real time
- [ ] Clearing input restores all markers
- [ ] Map is pannable and markers are tappable outside the search input area

### 5. Profile layer (map persistence test)

1. On the Map tab, pan to a specific location (e.g., zoom to Oslo)
2. Tap the Profile tab
3. Verify: the profile layer **slides up from the bottom**
4. Verify: placeholder profile content is visible
5. Tap the Map tab
6. Verify: the map is at exactly the same position as step 1 (no reload, no re-center)

### 6. Android blur fallback

On an Android emulator or device:
- [ ] Tab bar renders with a semi-transparent background (blur may or may not render depending on device)
- [ ] No crash; no blank/invisible tab bar

### 7. Font load failure simulation (optional)

In `_layout.tsx`, temporarily rename one font key (e.g., `'SpaceGrotesk-404': require('./missing.ttf')`):
- App should NOT hang at splash
- App should render with system fonts (not crash)
- Restore after testing

---

## Acceptance Criteria Checklist (from spec.md)

| Criterion | Verified By |
|-----------|-------------|
| No raw hex values in M1 component files | `grep` command above |
| Frosted glass visible on iOS | Screenshot from simulator |
| Frosted glass fallback on Android | Screenshot from Android emulator |
| Tab bar correct colors + icons | Visual inspection |
| iOS safe area — tab bar clear of home indicator | Visual inspection |
| Map state preserved on tab switch | Step 5 above |
| Search filters markers in real time | Step 4 above |
| Profile slides up, map stays mounted | Step 5 above |
| Font loading: splash gate works | Step 2 above |
| WCAG AA contrast over frosted glass | Use contrast checker on screenshots |
