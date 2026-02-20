# Test Specs: Map & Spots

These test specs are **framework-agnostic**. Adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, React Testing Library, etc.).

## Overview

The Map & Spots section lets users browse, view, and create Norwegian freediving spots on an interactive map. Key functionality includes spot discovery, detail sheets, favoriting, dive log display, spot rating, and spot creation.

---

## User Flow Tests

### Flow 1: View Spot Detail Sheet

**Scenario:** User taps a spot marker and views the spot's information

#### Success Path

**Setup:**
- Map is rendered with at least one spot in `data.spots`
- A spot with `latestReport` (fresh, < 30 days old) is selected

**Steps:**
1. `activeSpotId` is set to a valid spot ID (e.g., "spot-1")
2. `SpotDetailSheet` renders for the selected spot

**Expected Results:**
- [ ] Spot name appears as a large heading (e.g., "Langøyene")
- [ ] Visibility shows in green: e.g., "6m · 4 days ago"
- [ ] Star rating displays with fractional fill based on `averageRating`
- [ ] "＋ Add Dive" button is visible
- [ ] Spot description text is visible
- [ ] Access info section is visible with a pin icon
- [ ] Photos carousel shows if `spot.photos.length > 0`
- [ ] Dive log list shows all reports for this spot, newest first

#### Stale Report Path (> 30 days old)

**Setup:**
- Spot with `latestReport.date` more than 30 days in the past (e.g., "spot-2")

**Expected Results:**
- [ ] Visibility text is amber/yellow, not green
- [ ] Shows relative date (e.g., "47 days ago")

#### No Reports Path

**Setup:**
- Spot with `latestReport: null` (e.g., "spot-3")

**Expected Results:**
- [ ] Shows "No data yet" in place of visibility
- [ ] Dive Logs section shows "No dive logs yet. Be the first!"

---

### Flow 2: Toggle Favorite

**Scenario:** User taps the heart icon to save/unsave a spot

#### Add to Favorites

**Setup:**
- Spot with `isFavorited: false` is shown in detail sheet

**Steps:**
1. User clicks the heart icon (unfilled outline)

**Expected Results:**
- [ ] Heart icon fills (becomes solid/emerald)
- [ ] `onFavoriteToggle` is called with (spotId, false) — "was not favorited"

#### Remove from Favorites

**Setup:**
- Spot with `isFavorited: true` (e.g., "spot-1")

**Steps:**
1. User clicks the filled heart icon

**Expected Results:**
- [ ] Heart icon becomes outline (unfilled)
- [ ] `onFavoriteToggle` is called with (spotId, true) — "was favorited"

---

### Flow 3: Rate a Spot

**Scenario:** User taps the star rating area and submits a rating

**Steps:**
1. User clicks the star area in the detail sheet header
2. Rating overlay appears with 5 interactive stars
3. User hovers over star 4 → first 4 stars highlight (amber)
4. User clicks star 4

**Expected Results:**
- [ ] Rating overlay shows "Rate this spot" heading and spot name
- [ ] Stars highlight on hover
- [ ] On click, `onUpdateRating` is called with (spotId, 4)
- [ ] Overlay closes after selection

#### Cancel Rating

**Steps:**
1. Rating overlay is open
2. User clicks "Cancel" or the backdrop

**Expected Results:**
- [ ] Overlay closes
- [ ] `onUpdateRating` is NOT called

---

### Flow 4: Create a New Spot

**Scenario:** User taps the '+' FAB and completes the spot creation flow

**Steps:**
1. `activeSpotId` is null (no active spot)
2. FAB (emerald circle with '+') is visible
3. User clicks FAB → `onCreateSpotStart` is called
4. `isCreatingSpot` is set to true
5. `CreateSpotOverlay` renders with a pulsing pin in the center
6. User clicks "Create Dive Spot" → form step appears
7. User enters: name "Test Spot", description, access info
8. User clicks "Create Dive Spot" submit button

**Expected Results:**
- [ ] FAB is visible only when no spot is active
- [ ] Overlay shows instruction text "Pan & zoom to position your spot"
- [ ] Clicking "Create Dive Spot" shows the form
- [ ] On form submit, `onCreateSpotConfirm` is called with the correct payload
- [ ] Clicking "Cancel" at any step calls `onCreateSpotCancel`

---

### Flow 5: Add Parking Location During Spot Creation

**Scenario:** User adds a parking location while creating a spot

**Steps:**
1. User is on the form step of spot creation
2. User clicks "+ Add Parking Location"
3. Parking pin mode activates ("Pan & zoom to position parking")
4. User enters parking description
5. User clicks "Add Parking Location"

**Expected Results:**
- [ ] Returns to form step with parking listed
- [ ] Parking can be removed with the "×" button
- [ ] Multiple parking locations can be added

---

## Empty State Tests

### No Active Spot

**Scenario:** No spot is selected

**Setup:**
- `activeSpotId` is null, `isCreatingSpot` is false

**Expected Results:**
- [ ] FAB ('+' button) is visible in the bottom right
- [ ] No detail sheet is shown

### Empty Dive Log List

**Scenario:** Spot has `reportCount: 0` and no matching reports

**Setup:**
- `data.reports` contains no entries with `spotId` matching the active spot

**Expected Results:**
- [ ] Shows "No dive logs yet. Be the first!"
- [ ] Dive Logs count shows "(0)"

---

## Component Interaction Tests

### SpotReportRow

**Renders correctly:**
- [ ] Shows author alias
- [ ] Shows relative date ("today", "yesterday", "N days ago")
- [ ] Shows visibility badge (e.g., "6m" in teal)
- [ ] Shows current strength dots (filled count = report.current)
- [ ] Shows notes text if `report.notes` is not null
- [ ] Hides notes section if `report.notes` is null

**Avatar fallback:**
- [ ] Shows image if `authorAvatarUrl` is not null
- [ ] Shows initials (first 2 chars of alias, uppercase) if `authorAvatarUrl` is null

### SpotDetailSheet Dismiss

- [ ] Clicking the "×" close button calls `onDismiss`
- [ ] "＋ Add Dive" button calls `onAddDive`

---

## Edge Cases

- [ ] Handles spots with very long names — name should not overflow header layout
- [ ] Handles spots with no photos — photo carousel section is hidden
- [ ] Handles spots with `averageRating: null` — shows empty stars (no fill)
- [ ] Correctly orders dive logs newest-first (by `createdAt`)
- [ ] After dismissing a detail sheet, FAB becomes visible again
- [ ] CreateSpotOverlay handles empty optional fields (description, access info can be blank)

---

## Accessibility Checks

- [ ] Heart button has `aria-label` ("Add to favorites" / "Remove from favorites")
- [ ] Close button has `aria-label="Close"`
- [ ] FAB has `aria-label="Add dive spot"`
- [ ] Star rating buttons have `aria-label="Rate N stars"`
- [ ] Detail sheet is scrollable on small screens

---

## Sample Test Data

```typescript
// Populated spot (fresh report, favorited, rated by current user)
const mockSpotWithData = {
  id: "spot-1",
  name: "Langøyene",
  description: "Popular Oslo dive spot with eelgrass beds.",
  accessInfo: "Take the ferry from Aker Brygge.",
  position: { lat: 59.8785, lng: 10.7271 },
  parkingLocationIds: ["parking-1a"],
  photos: [],
  reportCount: 4,
  averageRating: 4.2,
  averageVisibility: 5.5,
  latestReport: { visibility: 6, date: new Date().toISOString() }, // fresh
  isFavorited: true,
  currentUserRating: 4,
};

// Empty spot (no reports)
const mockSpotEmpty = {
  id: "spot-3",
  name: "Bleikøya",
  description: "Quiet island with kelp forests.",
  accessInfo: "Private boat access only.",
  position: { lat: 59.8762, lng: 10.739 },
  parkingLocationIds: [],
  photos: [],
  reportCount: 0,
  averageRating: null,
  averageVisibility: null,
  latestReport: null,
  isFavorited: false,
  currentUserRating: null,
};

// Sample dive report
const mockReport = {
  id: "report-1a",
  spotId: "spot-1",
  authorAlias: "deepwater_dag",
  authorAvatarUrl: null,
  visibility: 6,
  current: 1 as const,
  notes: "Calm conditions. Visibility much better than last visit.",
  photos: [],
  createdAt: new Date().toISOString(),
};
```
