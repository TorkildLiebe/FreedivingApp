# Milestone 2: Map & Spots

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Shell) complete

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

Implement the Map & Spots feature — the fullscreen map for discovering, viewing, and creating Norwegian freediving spots.

## Overview

The Map & Spots section is the home screen of the app. Users can browse dive spots on an interactive map, tap a marker to view spot details (description, access info, photos, dive logs, ratings), add dive spots to favorites, rate spots, and create new spots. The map overlay components handle all the UI floating above the map.

**Key Functionality:**
- Browse dive spots on an interactive map with clustering
- Tap a marker to open a frosted-glass detail sheet
- View spot details: description, access info, photos, aggregated visibility + rating
- See all dive logs for a spot (newest first) in the detail sheet
- Toggle a spot as a favorite (heart icon)
- Rate a spot with 1–5 stars
- Create a new spot: place a pin, fill in name/description/access info/photos, optionally add parking locations
- Search for spots by name using the floating search bar

## Components Provided

Copy from `docs/design-os-plan/sections/map-and-spots/components/`:

- `MapAndSpots` — Main overlay managing FAB, detail sheet, and creation flow
- `SpotDetailSheet` — Bottom sheet with spot info, ratings, and dive logs
- `SpotReportRow` — Individual dive report row in the detail sheet
- `CreateSpotOverlay` — Full-screen spot creation flow (pin placement + form)

## Props Reference

**`MapAndSpots` expects:**

```tsx
<MapAndSpots
  data={{ spots, reports, parkingLocations }}
  searchQuery={searchQuery}
  activeSpotId={activeSpotId}       // null if no spot selected
  isCreatingSpot={isCreatingSpot}   // true when FAB was tapped
  onSpotPress={handleSpotPress}
  onSpotDismiss={handleDismiss}
  onFavoriteToggle={handleFavoriteToggle}
  onSearch={handleSearch}
  onCreateSpotStart={handleCreateStart}
  onCreateSpotConfirm={handleCreateConfirm}
  onCreateSpotCancel={handleCreateCancel}
  onAddDive={handleAddDive}         // opens the AddDiveForm
  onUpdateRating={handleUpdateRating}
/>
```

**Key types** (see `types.ts`):

```typescript
interface DiveSpot {
  id: string;
  name: string;
  description: string;
  accessInfo: string;
  position: { lat: number; lng: number };
  photos: Photo[];
  reportCount: number;
  averageRating: number | null;      // from SpotRatings
  averageVisibility: number | null;
  latestReport: { visibility: number; date: string } | null;
  isFavorited: boolean;
  currentUserRating: 1 | 2 | 3 | 4 | 5 | null;
}
```

## Expected User Flows

### Flow 1: View a Spot

1. User taps a marker on the map → `onSpotPress(spotId)` fires
2. App sets `activeSpotId` to the tapped spot's ID
3. `SpotDetailSheet` renders with the spot's data
4. **Outcome:** Spot details slide up from the bottom

### Flow 2: Dismiss a Spot

1. User taps the "×" button or swipes down
2. `onSpotDismiss()` fires
3. App sets `activeSpotId` to null
4. **Outcome:** Detail sheet closes, FAB reappears

### Flow 3: Create a New Spot

1. User taps the '+' FAB → `onCreateSpotStart()` fires
2. App sets `isCreatingSpot` to true
3. `CreateSpotOverlay` shows with an animated pin at map center
4. User pans map to position pin, then taps "Create Dive Spot"
5. Form slides up with name, description, access info, photo upload, optional parking
6. User submits → `onCreateSpotConfirm(payload)` fires with captured position
7. **Outcome:** New spot created; `isCreatingSpot` set back to false

### Flow 4: Log a Dive

1. User taps "＋ Add Dive" in the detail sheet → `onAddDive(spotId)` fires
2. App opens the `AddDiveForm` component (from Dive Reports section) as an overlay
3. **Outcome:** User submits a dive log

## Empty States

- **No spots:** Show an empty map with the '+' FAB still visible so users can add the first spot
- **No reports for a spot:** Detail sheet shows "No dive logs yet. Be the first!"
- **No visibility data:** Shows "No data yet" in place of the visibility metric

## Testing

See `docs/design-os-plan/sections/map-and-spots/tests.md` for UI behavior test specs covering:
- Spot detail display (fresh vs stale vs no reports)
- Favorite toggle
- Star rating interaction
- Spot creation flow
- Empty states

## Files to Reference

- `docs/design-os-plan/sections/map-and-spots/README.md` — Feature overview
- `docs/design-os-plan/sections/map-and-spots/tests.md` — UI behavior test specs
- `docs/design-os-plan/sections/map-and-spots/components/` — React components
- `docs/design-os-plan/sections/map-and-spots/types.ts` — TypeScript interfaces
- `docs/design-os-plan/sections/map-and-spots/sample-data.json` — Test data
- `docs/design-os-plan/sections/map-and-spots/screenshot.png` — Visual reference

## Done When

- [ ] Map renders with spot markers (using your map library)
- [ ] Tapping a marker opens the spot detail sheet
- [ ] Detail sheet shows correct spot data (name, visibility, rating, logs)
- [ ] Favorite toggle works and persists
- [ ] "＋ Add Dive" opens the dive log form
- [ ] Star rating overlay works and saves
- [ ] FAB is visible when no spot is selected
- [ ] Spot creation flow completes and saves a new spot
- [ ] Search bar filters visible spot markers
- [ ] Empty states display correctly
- [ ] Responsive on mobile
