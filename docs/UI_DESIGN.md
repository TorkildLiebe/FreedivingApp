# UI_DESIGN.md — DiveFreely (MVP)

Design system, component specs, and UI flows for React Native (Expo). Derived from Design OS reference components — web React source is reference only, not directly usable in RN.

---

## 1) Design Tokens

### Colors

Three Tailwind color families. Map to RN `shared/theme/colors.ts`.

| Role | Family | Key Shades | Usage |
|------|--------|------------|-------|
| **Primary** | Emerald | 50 `#ecfdf5`, 100 `#d1fae5`, 400 `#34d399`, 500 `#10b981`, 600 `#059669`, 700 `#047857` | Buttons, CTAs, active states, focus rings, FAB |
| **Secondary** | Teal | 50 `#f0fdfa`, 100 `#ccfbf1`, 400 `#2dd4bf`, 500 `#14b8a6`, 600 `#0d9488`, 700 `#0f766e` | Secondary actions, visibility badges, parking markers |
| **Neutral** | Stone | 50 `#fafaf9`, 100 `#f5f5f4`, 200 `#e7e5e4`, 300 `#d6d3d1`, 400 `#a8a29e`, 500 `#78716c`, 600 `#57534e`, 700 `#44403c`, 800 `#292524`, 900 `#1c1917`, 950 `#0c0a09` | Backgrounds, text, borders, frosted glass |

### Typography

Load via `expo-font`. Map to `shared/theme/typography.ts`.

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| **Heading** | Space Grotesk | 400, 500, 600, 700 | Spot names, modal titles, profile names, stat numbers |
| **Body** | Inter | 400, 500, 600, 700 | Labels, navigation, form inputs, descriptive text |
| **Mono** | IBM Plex Mono | 400, 500 | Visibility meters, numeric data display |

### Frosted Glass Pattern

Used for bottom nav, search bar, bottom sheets, and overlays:

```
backgroundColor: 'rgba(255, 255, 255, 0.8)'  // light mode
// dark: 'rgba(28, 25, 23, 0.85)'             // stone-900 @ 85%
backdropFilter (via BlurView): blur(12)
borderColor: 'rgba(231, 229, 228, 0.6)'       // stone-200 @ 60%
```

Use `expo-blur` BlurView for RN implementation.

---

## 2) App Shell

### Layout

- **Fullscreen map** occupies entire screen at all times (z-index 0)
- **Page content** (profile) renders above map when active (z-index 10)
- **Search bar** floats at top on map view only (z-index 20)
- **Overlay content** (detail sheets, modals, forms) at z-index 30
- **Bottom nav** always visible at z-index 20

### Navigation

2-tab bottom bar with frosted glass styling:

| Tab | Icon | Destination |
|-----|------|-------------|
| Map | Map icon | Map & Spots (home/default) |
| Profile | User icon | Auth & Profiles |

Safe area insets applied for iOS bottom nav. Use `useSafeAreaInsets()` from `react-native-safe-area-context`.

### Search Bar

Floating frosted glass input, visible only on map view. Fires `onSearch` to filter spot markers by name.

---

## 3) Screen & Component Specs

### 3.1 Map & Spots

#### SpotDetailSheet (Bottom Sheet)

Triggered by tapping a map marker. Shows:

- **Header**: spot name, favorite toggle (heart icon), close button
- **Stats row**: average visibility (mono font, teal badge), average rating (stars), report count
- **Stale indicator**: if latest report > 30 days old, show muted date
- **Tabs/sections**: Description, Access Info, Photos (horizontal scroll, max 5), Parking
- **Dive logs list**: newest first, each row shows author alias+avatar, visibility, current strength, notes preview, date
- **Actions**: "+ Add Dive" button, star rating (shows current user rating, tappable to change)

#### CreateSpotOverlay (Full-screen)

Two-phase flow:

1. **Pin placement**: animated pin at map center, user pans to position, "Create Dive Spot" button
2. **Form**: name (required), description, access info, photo upload (up to 5), optional parking locations

Captures GPS position from map center at confirmation.

#### Map Markers

- Cluster markers at low zoom levels
- Individual markers show spot icon
- Active/selected marker visually distinct

### 3.2 Dive Reports

#### AddDiveForm (2-step Bottom Sheet)

**Step 1 — Conditions:**
- Visibility slider: 0-30m range, large monospace display of current value
- Current selector: 5 labeled options (Calm, Light, Moderate, Strong, Very Strong) with visual strength bars
- Date picker: defaults to today, cannot be future

**Step 2 — Details (optional):**
- Notes textarea: 0-500 chars, character counter
- Photo upload: up to 5 photos, "+" button to add

Navigation: "Next" to step 2, "Back" to step 1, "Submit Dive" to complete.

#### RatingSheet (Bottom Sheet)

Auto-prompted after first dive submission at a spot (when `hasExistingRating` is false):

- Spot name header
- 5-star picker with labels: 1="Not great", 2="Below average", 3="Average", 4="Really good", 5="Outstanding"
- Tapping a star fires `onRate(rating)` and auto-closes
- "Not now" dismisses without saving

### 3.3 Auth & Profiles

#### AuthPage (Full-screen, standalone)

Deep-ocean aesthetic. Three views:

- **Login**: email + password fields, "Log in" button, "Continue with Google", link to signup, link to forgot password
- **Signup**: avatar upload (optional), alias, email, password fields, "Create account" button
- **Forgot password**: email field, "Send reset link" button, success state shows "Check your email"

View switching clears form state.

#### ProfilePage (inside App Shell via `pageContent`)

iOS-settings-style grouped list layout:

- **Header**: avatar (initials fallback when null), alias, bio, "Edit" button
- **Stat strip**: totalReports, uniqueSpotsDived, favoritesCount, memberSince
- **Activity section**: Dive Reports row, My Spots row, Saved Spots row (each navigates to detail list)
- **Account section**: Language row (English/Norsk), Change Password row
- **More section**: Legal row, Log Out row (red text)

#### Activity Detail Views

- **Dive Reports list**: cards showing spot name, date, visibility, current strength, notes preview
- **My Spots list**: cards showing spot name, created date, report count
- **Saved Spots list**: cards showing spot name, latest visibility, latest report date

Each has a "Back" navigation to return to main profile.

---

## 4) Empty States

| Context | Display |
|---------|---------|
| No spots on map | Empty map with '+' FAB visible |
| No reports for a spot | "No dive logs yet. Be the first!" |
| No visibility data for spot | "No data yet" in visibility metric |
| No rating for spot | Empty stars |
| Dive Reports (profile, empty) | "No dive reports yet" |
| My Spots (profile, empty) | "No spots created yet" |
| Saved Spots (profile, empty) | "No saved spots yet" |
| Favorite spot, no reports | "No reports" instead of visibility metric |
| Notes field (form) | Empty textarea; submitting sends `null` |
| Photos (form) | Only "+" add button shown |

---

## 5) UI Test Specs

Framework-agnostic behavioral specs per screen. Use `testID` convention: `<feature>-<element>-<type>`.

### Map & Spots

- Tapping marker opens detail sheet with correct spot data
- Detail sheet shows fresh vs stale (>30 days) report indicators
- Favorite toggle changes heart icon state and persists
- Star rating interaction updates and saves
- FAB visible when no spot selected, hidden when detail sheet open
- Spot creation flow: pin placement -> form -> submit creates spot
- Search bar filters visible markers by spot name
- Empty states render correctly for no-report and no-rating scenarios

### Dive Reports

- Step 1: visibility slider range 0-30m, current selector 5 options
- Step 1 -> Step 2 via "Next", Step 2 -> Step 1 via "Back"
- Submit with empty notes sends `notes: null`
- Character counter shows remaining chars for notes (500 max)
- RatingSheet appears after first dive submission when no existing rating
- Star selection fires onRate and auto-closes
- "Not now" dismisses rating sheet without saving

### Auth & Profiles

- Login form calls onLogin with email + password
- Signup form calls onSignUp with alias, email, password, optional avatar
- View switching clears form state
- Forgot password shows success confirmation
- Profile edit: inline form with alias, bio, avatar; save and cancel work
- Activity lists navigate and show data; empty states render
- Language picker selects and persists
- Logout calls onLogout

---

## 6) Accessibility Baseline

- All interactive elements must have accessible labels (`accessibilityLabel`)
- Bottom sheets must be scrollable when content exceeds viewport
- Form inputs support keyboard navigation and dismiss
- Star rating touchable areas must be minimum 44x44pt
- Color contrast: text on frosted glass must meet WCAG AA (4.5:1 for body text)
- Screen reader: spot names, visibility values, and ratings must be announced

---

*Note: Design OS web React components (`*.tsx` in `docs/design-os-plan/sections/`) are visual reference only. They use web-specific APIs (CSS, DOM, lucide-react) and must be reimplemented as React Native components.*

*Last updated: February 2026*
