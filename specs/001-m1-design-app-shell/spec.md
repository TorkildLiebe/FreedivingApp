# Feature Specification: M1 — Design System & App Shell

**Feature Branch**: `001-m1-design-app-shell`
**Created**: 2026-02-23
**Status**: Draft
**GitHub Issues**: #67, #68, #69, #70, #71
**Milestone**: M1 — Design System & App Shell

---

## Overview

Establish the visual foundation of the DiveFreely app by introducing a consistent design token system, a reusable frosted glass component, and a fully polished app shell. The shell comprises a styled bottom tab bar, a floating map search bar, and a profile page that overlays the map without unmounting it. All subsequent milestones (M2–M4) build their UI on top of these foundations.

---

## Clarifications

### Session 2026-02-23

- Q: Where should design tokens live? → A: `apps/mobile/src/shared/theme/` — replaces the existing `Colors.ts`. Design tokens are a UI-layer concern; they must not be placed in `packages/shared` (which is used by the backend).
- Q: How should the profile layer animate in? → A: Slide up from bottom (standard iOS sheet pattern). Preserves spatial orientation — user understands the profile is layered above the map, not a replacement screen.
- Q: What should users see while fonts load on first launch? → A: Splash screen held until fonts are ready (`SplashScreen.preventAutoHideAsync`), preventing a Flash Of Unstyled Text (FOUT).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Consistent visual identity on first launch (Priority: P1)

A new user opens the DiveFreely app for the first time. They see a polished, on-brand interface: the map fills the screen, a frosted glass tab bar sits at the bottom with clear Map and Profile icons, and the correct typography and colour palette are applied throughout.

**Why this priority**: Without design tokens and the frosted glass component, every subsequent UI story has unresolved style dependencies. This is the foundational layer — all other stories depend on it.

**Independent Test**: Can be verified by launching the app and confirming visual consistency across the tab bar, typography, and color use — delivering a branded shell even with placeholder content.

**Acceptance Scenarios**:

1. **Given** the app is freshly launched, **When** the Map tab is shown, **Then** the tab bar renders with a frosted glass background, correct emerald/stone icon colors, and Space Grotesk / Inter typography applied to all visible text.
2. **Given** design tokens are defined, **When** any M1 component is inspected, **Then** no raw hex values or font name strings appear outside the token definitions.
3. **Given** the app is running on iOS, **When** the bottom tab bar is visible, **Then** it does not overlap the home indicator (safe area insets applied).

---

### User Story 2 — Map search filters visible spots (Priority: P2)

A user is on the map view and wants to find a specific dive spot. They tap the floating search bar, type a name, and see the map markers narrow down in real time. Clearing the field restores all markers.

**Why this priority**: The search bar is a key interaction on the primary screen. It depends on the frosted glass component (P1) but delivers standalone user value as a filtering tool.

**Independent Test**: Can be fully tested by typing in the search field and observing marker filtering behavior — independent of profile or auth flows.

**Acceptance Scenarios**:

1. **Given** spots are loaded on the map, **When** the user types a partial name into the search bar, **Then** only markers whose names contain the search text remain visible.
2. **Given** the user has typed a search term, **When** they clear the input, **Then** all previously visible markers are restored.
3. **Given** no markers match the search term, **When** the user finishes typing, **Then** the map shows no markers and no crash occurs.
4. **Given** the search bar is rendered, **When** the user interacts with the map outside the input area, **Then** the search bar does not block map panning or tapping.

---

### User Story 3 — Profile accessible above the map (Priority: P3)

A user taps the Profile tab. The profile page slides up over the map in a full-page layer. The map remains loaded underneath — when the user returns to the Map tab, the map is immediately interactive (no reload delay). Profile shows placeholder content at this milestone.

**Why this priority**: The layer/navigation model is critical to establish now so later profile work (M4) slots in cleanly. The map persistence is a performance invariant that must be validated early.

**Independent Test**: Can be tested by tapping between tabs and confirming the map state (position, zoom) is preserved on return — independent of actual profile content.

**Acceptance Scenarios**:

1. **Given** the user is on the Map tab, **When** they tap the Profile tab, **Then** the profile layer animates into view above the map.
2. **Given** the profile layer is visible, **When** the user taps the Map tab, **Then** the profile layer dismisses and the map is immediately interactive with its previous state preserved.
3. **Given** the profile layer is open, **When** the map is inspected, **Then** the map component remains mounted (not unmounted/re-initialized).
4. **Given** the profile layer is shown, **Then** placeholder content is visible confirming the layer rendered correctly.

---

### Edge Cases

- **Font load failure**: If a custom font fails to load, the app must fall back to the system default font and remain usable (no blank screens or crashes).
- **Android blur limitation**: On Android devices where `BlurView` does not fully support blur, the frosted glass component must render with a semi-transparent background as a visual fallback.
- **Very long spot names in search**: Filtering by a long name string should not cause layout overflow or crash.
- **Rapid tab switching**: Tapping Map/Profile tabs quickly in succession should not cause the map to unmount or produce visual glitches.
- **Small screens / older devices**: The floating search bar must not obscure usable map area to the point of breaking the core map interaction.
- **Font loading on first launch**: The splash screen MUST remain visible until custom fonts have loaded. If fonts fail to load after the maximum retry window, the splash screen hides and the app renders with system font fallback.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Design Tokens (#67)

- **FR-001**: The app MUST define a typed color token set covering Emerald (primary), Teal (secondary), and Stone (neutral) families with the specific shades defined in `docs/UI_DESIGN.md`.
- **FR-002**: The app MUST define typography tokens for Space Grotesk (headings), Inter (body), and IBM Plex Mono (data display), with at least weights 400, 500, 600, and 700 where applicable.
- **FR-003**: All M1 components MUST consume colors and font families exclusively via tokens — no raw hex values or inline font strings in component files.
- **FR-004**: Tokens MUST be exported from `apps/mobile/src/shared/theme/`. The existing `Colors.ts` MUST be replaced (not augmented) by the token files defined in this milestone.

#### Frosted Glass Component (#68)

- **FR-005**: The app MUST provide a reusable `FrostedGlass` component that applies a frosted glass visual treatment as specified in `docs/UI_DESIGN.md` (semi-transparent white background with blur effect and stone border).
- **FR-006**: The `FrostedGlass` component MUST accept child content and an optional style override prop with no built-in layout assumptions.
- **FR-007**: The component MUST render on both iOS and Android — on Android, a semi-transparent fallback is acceptable when native blur is unavailable.
- **FR-008**: Text rendered over the frosted glass surface MUST meet WCAG AA contrast ratio (4.5:1 for body text).

#### Styled Tab Bar (#69)

- **FR-009**: The bottom tab bar MUST use the `FrostedGlass` component as its background.
- **FR-010**: The Map tab MUST display a map pin icon; the Profile tab MUST display a person silhouette icon.
- **FR-011**: The active tab icon MUST use the primary emerald color token; inactive tab icons MUST use the stone neutral token.
- **FR-012**: The tab bar MUST respect iOS safe area bottom insets so it does not overlap the device home indicator.
- **FR-013**: The tab bar MUST be visible on every screen (z-index 20, above map and page content).

#### Floating Search Bar (#70)

- **FR-014**: The map view MUST display a floating search input near the top of the screen, using `FrostedGlass` as its background.
- **FR-015**: The search bar MUST be positioned at z-index 20 (above the map, below modals and full-page layers).
- **FR-016**: Typing in the search bar MUST filter visible spot markers by name in real time (client-side, against already-fetched spots).
- **FR-017**: Clearing the search input MUST restore all previously visible spot markers.
- **FR-018**: The search bar MUST NOT block map interaction in areas outside the input element.

#### Profile Page Layer (#71)

- **FR-019**: Tapping the Profile tab MUST cause a full-page profile layer to animate into view above the map using a slide-up-from-bottom animation (standard iOS sheet pattern).
- **FR-020**: The map MUST remain mounted while the profile layer is visible — it MUST NOT be unmounted or re-initialized.
- **FR-021**: The profile layer MUST render at z-index 10 (above the map at z-index 0).
- **FR-022**: Navigating back to the Map tab MUST dismiss the profile layer and leave the map in its previous state (position, zoom, markers).
- **FR-023**: Placeholder profile content MUST be displayed within the layer at this milestone.

### Key Entities

- **Design Token**: A named, typed constant for a color value or font family/weight. Referenced by all styled components. No runtime data — purely a build-time asset.
- **FrostedGlass**: A reusable visual container that applies the frosted glass treatment. Wraps arbitrary child content. Has no opinion about the content or layout inside it.
- **App Shell**: The persistent layout containing the map (always mounted) and the navigation layer. Profile content is mounted as a full-page layer within this shell.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer adding a new M1+ component never needs to look up a hex color value or font name — they import from the token file.
- **SC-002**: The frosted glass effect is visible and correct on at least one iOS device and one Android device (or a documented Android fallback is in place).
- **SC-003**: The tab bar and floating search bar pass visual inspection against the `docs/UI_DESIGN.md` spec with no obvious deviations in color, spacing, or iconography.
- **SC-004**: Returning from the Profile tab to the Map tab takes under 300ms to show the interactive map — no reload or re-initialization delay is perceptible.
- **SC-005**: The search bar filters spot markers in real time with no perceptible lag for up to 500 visible markers.
- **SC-006**: All new components pass a basic accessibility check: interactive elements have accessible labels and text on frosted glass meets WCAG AA contrast.
- **SC-007**: Zero raw hex values or inline font strings appear in any M1 component file (enforced by code review).

---

## Assumptions

- The M0 map view and bottom tab navigation are already functional (per ROADMAP.md) — this milestone styles and extends that foundation, not replaces it.
- Dark mode is out of scope for M1; the frosted glass light-mode spec is sufficient.
- IBM Plex Mono font token is defined but not actively used in M1 components (it will be consumed in M2 for visibility data).
- The profile page layer uses placeholder content only; full profile UI is deferred to M4.
- Android blur fallback (semi-transparent background without native blur) is acceptable for M1.
- Font loading failures should degrade gracefully to system fonts; a broken app state is not acceptable.

---

## Dependencies

- **M0 completion**: Expo Router setup, MapLibre map, and tab navigation must be in place before M1 can layer on top.
- **Issue ordering**: #67 (tokens) → #68 (FrostedGlass) → #69, #70, #71 in parallel (all depend on #67 and #68).
- **expo-blur**: Must be installed as part of this milestone — it is not currently in `package.json`. Required for the FrostedGlass component.
- **react-native-safe-area-context**: Required for iOS safe area insets on the tab bar.
