# Milestone 3: Dive Reports

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Shell) and Milestone 2 (Map & Spots) complete

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

Implement dive logging and spot rating — the two recording features that build the community knowledge base.

## Overview

Dive Reports has two complementary features: **Dive Logs** (repeatable condition records per spot) and **Spot Ratings** (one permanent quality rating per user per spot). After a dive, users log visibility and current strength. If they haven't rated the spot before, a follow-up rating sheet appears automatically. Together these give future divers both real-time condition signals and a stable quality score.

**Key Functionality:**
- Multi-step dive log form: visibility slider (0–30m), current selector (5 levels), optional date
- Step 2: optional notes (up to 500 chars) and photo upload (up to 5)
- After successful submission: if no existing rating, show rating follow-up sheet
- Rating sheet: 5-star picker with label ("Not great" through "Outstanding"), dismissible
- Logged dives appear in spot detail sheets (Map & Spots) and on the user's profile

## Components Provided

Copy from `product-plan/sections/dive-reports/components/`:

- `AddDiveForm` — Multi-step bottom sheet for logging a dive
- `RatingSheet` — Follow-up bottom sheet for rating a spot after a dive

## Props Reference

**`AddDiveForm` props:**
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
```

**`RatingSheet` props:**
```tsx
<RatingSheet
  spotName="Langøyene"
  onRate={(rating) => handleSpotRating(spotId, rating)}
  onDismiss={() => setShowRating(false)}
/>
```

**`onSubmit` receives:**
```typescript
{
  spotId: string;
  authorAlias: string;
  authorAvatarUrl: string | null;
  visibility: number;      // 0–30 meters
  current: 1 | 2 | 3 | 4 | 5;
  notes: string | null;
  photos: string[];        // URLs
}
```

## Expected User Flows

### Flow 1: Log a Dive (Quick — Step 1 Only)

1. User taps "＋ Add Dive" in the spot detail sheet
2. `AddDiveForm` opens with visibility slider and current selector
3. User sets visibility to 8m, selects "Calm" current
4. User taps "Next" → Step 2 appears (notes + photos)
5. User taps "Submit Dive" with empty notes
6. **Outcome:** `onSubmit` fires with `notes: null`; form closes

### Flow 2: Log a Dive (Full — Both Steps)

1. User completes Step 1 (visibility, current)
2. User taps "Next" → Step 2
3. User adds notes and optionally photos
4. User taps "Submit Dive"
5. **Outcome:** Full log submitted including notes

### Flow 3: Rate Spot After Diving (First Time)

1. After successful dive submission, `hasExistingRating` was false
2. Show `RatingSheet` with the spot name
3. User selects 4 stars → "Really good" label appears
4. User clicks star 4
5. **Outcome:** `onRate(4)` fires; sheet closes automatically

### Flow 4: Skip Rating

1. `RatingSheet` appears after dive submission
2. User clicks "Not now"
3. **Outcome:** `onDismiss` fires; no rating saved

## Empty States

- No empty state for the form itself — it's always initialized with defaults (8m, Calm, today's date)
- Notes field: empty textarea; submitting with no notes sends `notes: null`
- Photos: only the "+" add button shown; no uploaded photos in the sample design

## Testing

See `product-plan/sections/dive-reports/tests.md` for UI behavior test specs covering:
- Step 1 and Step 2 submission flows
- Navigation between steps (Back button)
- Form dismiss flows
- Rating sheet interactions
- Character counter and edge cases

## Files to Reference

- `product-plan/sections/dive-reports/README.md` — Feature overview
- `product-plan/sections/dive-reports/tests.md` — UI behavior test specs
- `product-plan/sections/dive-reports/components/` — React components
- `product-plan/sections/dive-reports/types.ts` — TypeScript interfaces
- `product-plan/sections/dive-reports/sample-data.json` — Test data
- `product-plan/sections/dive-reports/screenshot.png` — Visual reference

## Done When

- [ ] `AddDiveForm` renders and opens from the spot detail "＋ Add Dive" button
- [ ] Visibility slider works (0–30m range, large monospace display)
- [ ] Current selector works (5 labeled options with visual bars)
- [ ] Step 1 → Step 2 navigation works (Next button)
- [ ] Step 2 → Step 1 navigation works (Back button)
- [ ] Submitted dive log appears in the spot's dive log list
- [ ] `RatingSheet` appears after submission when user hasn't rated the spot
- [ ] Star rating submission saves a `SpotRating` for the user+spot
- [ ] "Not now" dismisses rating sheet without saving
- [ ] Dive logs appear on the user's profile page
