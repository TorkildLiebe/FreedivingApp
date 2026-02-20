# Freedive App — Complete Implementation Instructions

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

## Testing

Each section includes a `tests.md` file with UI behavior test specs. These are **framework-agnostic** — adapt them to your testing setup.

**For each section:**
1. Read `product-plan/sections/[section-id]/tests.md`
2. Write tests for key user flows (success and failure paths)
3. Implement the feature to make tests pass
4. Refactor while keeping tests green

---

# Product Overview

Freedive App is a mobile-first tool for discovering and planning freediving in Norway. Divers can find spots on an interactive map, log conditions after a dive, and build a shared knowledge base about Norwegian waters.

**Problems Solved:**
1. No reliable place to find Norwegian freediving spots
2. Hard to know when conditions are good at a spot
3. Marine research lacks open community data
4. Hard to find other divers in the area

**Key Features:** Interactive map with spot discovery, spot creation with GPS and photos, dive reports with visibility + current + ratings, photo attachments, favorites, user profiles, multilingual UI (Norwegian/English), Norgeskart map tiles.

**Product Entities:** User, DiveSpot, DiveReport, SpotRating, Photo, Favorite

**Implementation Sequence:** Shell → Map & Spots → Dive Reports → Auth & Profiles

---

# Milestone 1: Shell

## Goal

Set up the design tokens and application shell — the persistent chrome that wraps all sections.

## What to Implement

### 1. Design Tokens

Configure your styling system:

- See `product-plan/design-system/tokens.css` for CSS custom properties
- See `product-plan/design-system/tailwind-colors.md` for Tailwind color usage
- See `product-plan/design-system/fonts.md` for Google Fonts setup

**Key choices:** Primary: emerald | Secondary: teal | Neutral: stone | Fonts: Space Grotesk / Inter / IBM Plex Mono

```bash
npm install lucide-react
```

### 2. Application Shell

Copy from `product-plan/shell/components/`:
- `AppShell.tsx` — Fullscreen layout wrapper
- `BottomNav.tsx` — Frosted glass bottom tab bar
- `SearchBar.tsx` — Floating frosted glass search input

**Wire up navigation (Map + Profile tabs):**

```tsx
const navItems = [
  { id: 'map', label: 'Map', href: '/', isActive: currentRoute === '/' },
  { id: 'profile', label: 'Profile', href: '/profile', isActive: currentRoute === '/profile' },
]

<AppShell
  mapContent={<YourMapComponent />}
  pageContent={isProfileRoute ? <ProfilePage {...props} /> : undefined}
  navigationItems={navItems}
  onNavigate={(item) => router.push(item.href)}
  searchValue={searchQuery}
  onSearchChange={setSearchQuery}
/>
```

## Done When

- [ ] Design tokens configured
- [ ] Shell renders with fullscreen map base layer
- [ ] Bottom tab bar shows Map and Profile tabs
- [ ] Navigation switches between views
- [ ] Search bar visible on map view, hidden on profile view

---

# Milestone 2: Map & Spots

## Goal

Implement the fullscreen map for discovering, viewing, and creating Norwegian freediving spots.

## Overview

The home screen. Users browse spots on an interactive map, tap markers to view detail sheets with descriptions/photos/dive logs/ratings, favorite spots, rate spots, and create new spots via a guided pin-placement flow.

**Key Functionality:** Map markers with clustering, spot detail sheet (frosted glass, slides up), favorite toggle, star rating, spot creation (pin + form + optional parking), search filtering.

## Components Provided

Copy from `product-plan/sections/map-and-spots/components/`:
- `MapAndSpots` — Overlay managing FAB, detail sheets, creation flow
- `SpotDetailSheet` — Bottom sheet with spot data and dive logs
- `SpotReportRow` — Individual dive log row
- `CreateSpotOverlay` — Full-screen spot creation flow

## Props Reference

```tsx
<MapAndSpots
  data={{ spots, reports, parkingLocations }}
  searchQuery={searchQuery}
  activeSpotId={activeSpotId}
  isCreatingSpot={isCreatingSpot}
  onSpotPress={handleSpotPress}
  onSpotDismiss={handleDismiss}
  onFavoriteToggle={handleFavoriteToggle}
  onSearch={handleSearch}
  onCreateSpotStart={handleCreateStart}
  onCreateSpotConfirm={handleCreateConfirm}
  onCreateSpotCancel={handleCreateCancel}
  onAddDive={handleAddDive}
  onUpdateRating={handleUpdateRating}
/>
```

## Expected User Flows

**View Spot:** Tap marker → `onSpotPress(spotId)` → set `activeSpotId` → detail sheet slides up

**Create Spot:** Tap FAB → `onCreateSpotStart()` → set `isCreatingSpot: true` → `CreateSpotOverlay` → user positions pin + fills form → `onCreateSpotConfirm(payload)` → save spot

**Add Dive:** "＋ Add Dive" in detail sheet → `onAddDive(spotId)` → open `AddDiveForm` (Milestone 3)

## Done When

- [ ] Map renders with spot markers and clustering
- [ ] Detail sheet opens on marker tap
- [ ] Detail sheet shows correct data (name, visibility, rating, dive logs)
- [ ] Favorite toggle persists
- [ ] Star rating overlay works
- [ ] FAB visible when no spot selected
- [ ] Spot creation flow saves a new spot
- [ ] Search filters visible markers

---

# Milestone 3: Dive Reports

## Goal

Implement dive logging and spot quality rating.

## Overview

Two recording features: Dive Logs (repeatable per-spot condition records) and Spot Ratings (one quality rating per user per spot). After logging a dive, if the user hasn't rated the spot before, a follow-up rating sheet appears.

**Key Functionality:** Multi-step dive form (visibility slider 0–30m, current selector 5 levels, optional date), Step 2 (notes up to 500 chars, photo upload), post-dive rating sheet (5 stars, dismissible).

## Components Provided

Copy from `product-plan/sections/dive-reports/components/`:
- `AddDiveForm` — Multi-step bottom sheet for logging
- `RatingSheet` — Follow-up rating sheet

## Props Reference

```tsx
<AddDiveForm
  spotId="spot-1"
  spotName="Langøyene"
  authorAlias={currentUser.alias}
  authorAvatarUrl={currentUser.avatarUrl}
  hasExistingRating={userHasRatedThisSpot}
  onSubmit={(log) => handleDiveSubmit(log)}
  onDismiss={() => setShowForm(false)}
/>

<RatingSheet
  spotName="Langøyene"
  onRate={(rating) => handleSpotRating(spotId, rating)}
  onDismiss={() => setShowRating(false)}
/>
```

## Expected User Flows

**Log a Dive:** "＋ Add Dive" → form opens → set visibility/current → Next → optional notes → Submit Dive → `onSubmit(log)` fires

**Rate After Dive:** If `hasExistingRating` was false, show `RatingSheet` after submission → user selects stars → `onRate(rating)` fires → sheet closes

## Done When

- [ ] `AddDiveForm` opens from spot detail and submits correctly
- [ ] Visibility slider and current selector work
- [ ] Step 1 ↔ Step 2 navigation works
- [ ] Submitted dive appears in spot detail and user profile
- [ ] `RatingSheet` appears after first dive at a spot
- [ ] Star rating saves to `SpotRating`

---

# Milestone 4: Auth & Profiles

## Goal

Implement authentication and user profile management.

## Overview

Auth page: full-screen standalone with deep-ocean background. Supports email/password login, Google OAuth, sign-up with alias + optional avatar, password reset with success confirmation. Profile page: inside the shell via `pageContent`, iOS-settings-style layout with activity stats and detail views.

**Key Functionality:** Login/signup/forgot-password views with state switching, profile header (avatar with initials fallback, alias, bio), activity stat strip, settings groups (Activity/Account/More), inline profile editing, language picker (English/Norsk), password change, logout.

## Components Provided

Copy from `product-plan/sections/auth-and-profiles/components/`:
- `AuthPage` — Full-screen auth page
- `ProfilePage` — Profile management page

## Props Reference

```tsx
<AuthPage
  onLogin={(email, password) => handleLogin(email, password)}
  onGoogleLogin={() => handleGoogleLogin()}
  onSignUp={(alias, email, password, avatar) => handleSignUp(...)}
  onForgotPassword={(email) => sendPasswordReset(email)}
/>

// In AppShell:
pageContent={isProfileRoute ? <ProfilePage
  currentUser={authenticatedUser}
  diveReports={userDiveReports}
  createdSpots={userCreatedSpots}
  favorites={userFavorites}
  stats={activityStats}
  onEditProfile={handleProfileEdit}
  onChangePassword={handlePasswordChange}
  onLogout={handleLogout}
  onChangeLanguage={handleLanguageChange}
/> : undefined}
```

## Expected User Flows

**Login:** Enter email + password → click "Log in" → `onLogin` fires → redirect to map

**Sign Up:** Switch to signup → enter alias/email/password/optional avatar → "Create account" → `onSignUp` fires

**Profile Edit:** Click "Edit" on profile → inline form → save → `onEditProfile` fires

**Logout:** "Log out" in More section → `onLogout` fires immediately

## Empty States

- Dive Reports: 🤿 "No dive reports yet"
- My Spots: 📍 "No spots created yet"
- Saved Spots: ♥ "No saved spots yet"
- Favorite with no reports: shows "No reports" instead of visibility

## Done When

- [ ] Auth page renders with all three views (login, signup, forgot password)
- [ ] View switching clears form fields
- [ ] Login and signup fire correct callbacks
- [ ] Forgot password shows success state with email confirmation
- [ ] Profile page renders inside the shell
- [ ] Activity stats show correct counts
- [ ] All three activity detail views work with correct empty states
- [ ] Inline profile edit saves and cancels correctly
- [ ] Language picker selects and persists
- [ ] Logout fires callback
