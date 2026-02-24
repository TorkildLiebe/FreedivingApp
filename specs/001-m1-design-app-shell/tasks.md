# Tasks: M1 — Design System & App Shell

**Input**: Design documents from `specs/001-m1-design-app-shell/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/component-api.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All paths relative to repository root

---

## Phase 1: Setup (Dependencies & Assets)

**Purpose**: Install new dependency and place font assets. Must complete before any code is written.

- [X] T001 Install expo-blur via `npx expo install expo-blur` run from `apps/mobile/`
- [X] T002 Download Space Grotesk (Regular/Medium/SemiBold/Bold), Inter (Regular/Medium/SemiBold/Bold), and IBM Plex Mono (Regular/Medium) `.ttf` files and place in `apps/mobile/assets/fonts/` — see `specs/001-m1-design-app-shell/quickstart.md` for sources and exact filenames

---

## Phase 2: Foundational (Design Tokens + FrostedGlass)

**Purpose**: Core token system and primitive component that ALL user stories depend on.

**⚠️ CRITICAL**: CustomTabBar, search bar, and profile overlay all depend on tokens and FrostedGlass. No user story work can begin until this phase is complete.

- [X] T003 [P] Create `apps/mobile/src/shared/theme/colors.ts` — typed `Colors` object with Emerald (`primary`), Teal (`secondary`), and Stone (`neutral`) palettes with exact hex values from `specs/001-m1-design-app-shell/data-model.md`
- [X] T004 [P] Create `apps/mobile/src/shared/theme/typography.ts` — typed `Typography` object with 8 role-based variants (`h1`, `h2`, `h3`, `body`, `bodySmall`, `bodyBold`, `mono`, `monoBold`) and system-font fallback variants, as specified in `specs/001-m1-design-app-shell/data-model.md`
- [X] T005 Create `apps/mobile/src/shared/theme/index.ts` — barrel export: `export { colors } from './colors'; export { typography } from './typography';` (depends on T003, T004)
- [X] T006 Delete `apps/mobile/src/shared/theme/Colors.ts` — replaced entirely by new token files; update all import sites (depends on T005)
- [X] T007 Modify `apps/mobile/app/_layout.tsx` — expand `useFonts` to load all 10 custom fonts using `FontFamily-Weight` naming convention (e.g., `'SpaceGrotesk-700'`); update `useEffect` to call `SplashScreen.hideAsync()` on both `loaded` and `error` paths (graceful fallback to system fonts, no app hang)
- [X] T008 Create `apps/mobile/src/shared/components/FrostedGlass.tsx` — `BlurView` (from `expo-blur`) wrapped in `<View style={{ overflow: 'hidden' }}>` for border radius support; props: `children: React.ReactNode`, `style?: ViewStyle`, `intensity?: number` (default 70); use `tint="light"`, `experimentalBlurMethod="dimezisBlurView"` for Android; internal constants per D-006 in `specs/001-m1-design-app-shell/research.md` (depends on T005)

**Checkpoint**: Tokens and FrostedGlass ready — user story implementation can begin (US1 + US2 can proceed in parallel)

---

## Phase 3: User Story 1 — Consistent visual identity on first launch (Priority: P1) 🎯 MVP

**Goal**: The map fills the screen with a polished frosted glass tab bar, correct emerald/stone icon colors, and Space Grotesk/Inter typography applied throughout. Branded shell visible even with placeholder content.

**Independent Test**: Launch the app → tab bar renders with frosted glass background, Map/Profile icons in correct colors, typography applied. Run grep to confirm zero raw hex values in M1 component files.

### Implementation for User Story 1

- [X] T009 [US1] Create `apps/mobile/src/shared/components/CustomTabBar.tsx` — accepts `BottomTabBarProps` from `@react-navigation/bottom-tabs`; uses `FrostedGlass` as background; `useSafeAreaInsets()` for bottom padding (`Math.max(insets.bottom, 12)`); FontAwesome `"map"` icon for Map tab, `"user"` icon for Profile tab (from `@expo/vector-icons`); active color `colors.primary[500]`, inactive `colors.neutral[500]`; calls `navigation.emit({ type: 'tabPress', target: route.key })` on press; `accessibilityRole="button"` and `accessibilityState` on each tab button
- [X] T010 [US1] Modify `apps/mobile/app/(app)/(tabs)/_layout.tsx` — add `screenOptions={{ unmountOnBlur: false }}` to keep map mounted; add `tabBar={(props) => <CustomTabBar {...props} />}`; import `CustomTabBar` from `@/src/shared/components/CustomTabBar`

**Checkpoint**: User Story 1 complete — branded visual shell independently testable; US3 can now proceed (depends on T010)

---

## Phase 4: User Story 2 — Map search filters visible spots (Priority: P2)

**Goal**: Floating frosted glass search bar near top of map screen filters spot markers by name in real time; clearing the field restores all markers; map remains pannable.

**Independent Test**: Type a partial spot name in search bar → only matching markers remain; clear input → all markers restored; pan/tap map outside input area works normally.

### Implementation for User Story 2

- [X] T011 [US2] Modify `apps/mobile/src/features/map/screens/map-screen.tsx` — add `useState<string>` for search query; add `TextInput` wrapped in `FrostedGlass` positioned `position: 'absolute'` near top with `zIndex: 20`; client-side filter: `spots.filter(s => s.title.toLowerCase().includes(query.toLowerCase()))`; pass filtered spots array to map markers; clearing input passes the full unfiltered spots array; set appropriate `pointerEvents` on wrapper so areas outside input do not block map interaction

**Checkpoint**: User Story 2 complete — search filtering independently testable

---

## Phase 5: User Story 3 — Profile accessible above the map (Priority: P3)

**Goal**: Tapping the Profile tab slides a full-page profile layer up over the map; the map remains mounted underneath; returning to Map tab shows the map in its previous state.

**Independent Test**: Pan map to a specific location → tap Profile tab → layer slides up from bottom → placeholder content visible → tap Map tab → map at same position, no reload.

### Implementation for User Story 3

- [X] T012 [US3] Modify `apps/mobile/src/features/auth/screens/profile-screen.tsx` — rewrite as animated overlay: `StyleSheet.absoluteFillObject` + `zIndex: 10`; `useAnimatedStyle` + `withTiming` from `react-native-reanimated` for slide-up animation (`translateY: screenHeight → 0` on mount); placeholder content: centered `<Text>` reading "Profile coming in M4" styled with `typography.body` and `colors.neutral[900]`; neutral background (`colors.neutral[50]`) for readability over map

**Checkpoint**: All three user stories complete — full M1 app shell functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Token integrity enforcement and final verification across all stories

- [X] T013 [P] Token integrity check — run grep: `grep -rn '#[0-9a-fA-F]\{6\}' apps/mobile/src/shared/components/FrostedGlass.tsx apps/mobile/src/shared/components/CustomTabBar.tsx apps/mobile/src/features/map/screens/map-screen.tsx apps/mobile/src/features/auth/screens/profile-screen.tsx` — must return zero matches; also check for inline font strings; fix any violations found
- [X] T014 [P] Accessibility audit — verify all tab buttons in `apps/mobile/src/shared/components/CustomTabBar.tsx` have `accessibilityLabel`; verify text over frosted glass meets WCAG AA (4.5:1) by reviewing token values used against background
- [X] T015 Run complete `specs/001-m1-design-app-shell/quickstart.md` verification — all steps including iOS Simulator screenshots (tab bar, search bar, profile layer slide-up) and Android emulator screenshot (frosted glass fallback); confirm font loading splash gate; confirm map state preserved on tab switch

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (expo-blur installed, fonts placed) — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2
- **US2 (Phase 4)**: Depends on Phase 2 — **independent of US1, can run in parallel with US1**
- **US3 (Phase 5)**: Depends on T010 (US1) for `unmountOnBlur: false` — otherwise independent
- **Polish (Phase 6)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: After Phase 2 — no dependency on US1 or US3 (FrostedGlass is the only shared dep)
- **US3 (P3)**: After T010 (US1) — `unmountOnBlur: false` must be set before the profile overlay pattern is meaningful

### Parallel Opportunities

- T003 + T004 (colors.ts and typography.ts) — different files, no mutual dependency
- After Phase 2: T009+T010 (US1) and T011 (US2) can proceed in parallel
- T013 + T014 (polish) — different concerns, no dependency

---

## Parallel Execution Examples

```bash
# Phase 2 — tokens in parallel:
Task: "Create colors.ts (T003)"
Task: "Create typography.ts (T004)"

# After Phase 2 completes — US1 and US2 in parallel:
Task: "Create CustomTabBar.tsx + modify _layout.tsx (T009→T010)"  # US1
Task: "Add search bar to map-screen.tsx (T011)"                   # US2
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install expo-blur, place fonts)
2. Complete Phase 2: Foundational (tokens + FrostedGlass)
3. Complete Phase 3: User Story 1 (CustomTabBar + tab layout)
4. **STOP and VALIDATE**: branded shell with frosted glass tab bar visible in simulator
5. Proceed to US2 + US3

### Incremental Delivery

1. Setup + Foundational → token system and FrostedGlass ready
2. US1 → branded tab bar + visual identity → **independently demoable**
3. US2 → search bar → **standalone user value, independent of profile**
4. US3 → profile overlay → **navigation model complete**
5. Polish → token integrity confirmed + screenshots as evidence

---

## Notes

- No backend, database, or shared-package changes in M1
- `expo-blur` must be installed via `npx expo install` (not `npm install`) — managed workflow requires SDK-compatible pinning (D-003)
- Font `.ttf` files must be placed before any simulator launch; see `quickstart.md` for download sources
- No test tasks generated — spec does not request TDD; acceptance is via simulator screenshots per quickstart.md
- Android frosted glass fallback (semi-transparent, no native blur) is acceptable per FR-007
- Frosted glass constants (`rgba(255,255,255,0.8)` background, `rgba(231,229,228,0.6)` border) are intentionally internal to `FrostedGlass.tsx` — they are visual recipes, not re-exportable color tokens (D-006)
