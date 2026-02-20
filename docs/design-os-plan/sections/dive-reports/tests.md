# Test Specs: Dive Reports

These test specs are **framework-agnostic**. Adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, React Testing Library, etc.).

## Overview

Dive Reports covers two features: dive logging (AddDiveForm, multi-step) and spot quality rating (RatingSheet, shown after logging). The form lets users record visibility, current strength, optional notes, and photos. The rating sheet prompts users to rate the spot after submitting a dive.

---

## User Flow Tests

### Flow 1: Submit a Dive Log (Step 1 only)

**Scenario:** User fills in visibility and current, skips notes, submits from step 1

**Setup:**
- `AddDiveForm` is rendered with spotId, spotName, authorAlias

**Steps:**
1. Form opens on Step 1
2. User drags visibility slider to 8 → value shows "8 m"
3. User selects "Moderate" current (value 3)
4. User clicks "Next" button

**Expected Results:**
- [ ] Step 2 becomes visible (Notes & Photos heading)
- [ ] Step progress bar shows both segments filled
- [ ] "Step 2 of 2" label appears

**Then user clicks "Submit Dive":**
- [ ] `onSubmit` is called with correct data:
  - `visibility: 8`
  - `current: 3`
  - `notes: null` (empty textarea)
  - `photos: []`
  - `spotId` matching the provided prop

---

### Flow 2: Submit a Dive Log (Both Steps)

**Scenario:** User fills in all fields including notes

**Steps:**
1. Step 1: set visibility to 12, select "Strong" current (4), set date
2. Click "Next"
3. Step 2: type notes "Clear water, saw a jellyfish"
4. Click "Submit Dive"

**Expected Results:**
- [ ] Character counter updates (e.g., "33 / 500")
- [ ] `onSubmit` called with:
  - `visibility: 12`
  - `current: 4`
  - `notes: "Clear water, saw a jellyfish"`

---

### Flow 3: Navigate Back Between Steps

**Scenario:** User goes to step 2 then returns to step 1

**Steps:**
1. Click "Next" to go to step 2
2. Enter some notes text
3. Click "← Back" button

**Expected Results:**
- [ ] Returns to Step 1 with visibility and current values preserved
- [ ] Step indicator shows Step 1 of 2
- [ ] Second progress segment is unfilled

---

### Flow 4: Dismiss the Form

**Scenario:** User closes the form without submitting

**Steps:**
1. User clicks the "×" close button
   OR
2. User clicks the backdrop overlay

**Expected Results:**
- [ ] `onDismiss` is called
- [ ] `onSubmit` is NOT called

---

### Flow 5: Rate a Spot After Diving (RatingSheet)

**Scenario:** User rates a spot 4 stars after successfully logging a dive

**Setup:**
- `RatingSheet` is rendered with spotName and callbacks

**Steps:**
1. RatingSheet appears showing "Dive logged" and "How would you rate [spotName]?"
2. User hovers over star 4 → "Really good" label appears
3. User clicks star 4

**Expected Results:**
- [ ] Stars 1–4 are highlighted (emerald) on hover
- [ ] "Really good" label appears below stars
- [ ] After clicking, `onRate` is called with `4`
- [ ] Sheet closes (with slight delay)

#### Dismiss Without Rating

**Steps:**
1. User clicks "Not now"

**Expected Results:**
- [ ] `onDismiss` is called
- [ ] `onRate` is NOT called

---

## Empty State Tests

### Notes Field Empty

**Setup:**
- User is on step 2 with an empty textarea

**Expected Results:**
- [ ] Character counter shows "0 / 500"
- [ ] Submitting with empty notes results in `notes: null` in `onSubmit` callback

---

## Component Interaction Tests

### AddDiveForm — Visibility Slider

- [ ] Default value is 8m
- [ ] Slider range is 0 to 30
- [ ] Large monospace number updates in real-time as slider moves
- [ ] Track fill gradient grows from left with slider position
- [ ] Min (0 m) and max (30 m) labels are visible below slider

### AddDiveForm — Current Selector

- [ ] 5 buttons shown: Calm, Light, Moderate, Strong, Very Strong
- [ ] Each button shows visual intensity bars (increasing height)
- [ ] Selected button has emerald border and background
- [ ] Default selection is "Calm" (1)
- [ ] Only one option can be selected at a time

### AddDiveForm — Date Field

- [ ] Defaults to today's date
- [ ] Field is optional (no required attribute behavior enforced)
- [ ] Label shows "optional · defaults to today"

### RatingSheet — Star Interaction

- [ ] Stars highlight progressively on hover (1 star hover → 1 filled, 3 star hover → 3 filled)
- [ ] Hover label shows correct text per rating level
- [ ] Stars de-highlight when mouse leaves
- [ ] Clicking a star triggers `onRate` with that rating value
- [ ] Clicking backdrop calls `onDismiss`

---

## Edge Cases

- [ ] Notes at exactly 500 characters: counter shows "500 / 500" and input accepts no more
- [ ] Notes with only whitespace: submitted as `notes: null` (trimmed before check)
- [ ] Visibility at 0m: slider can be set to minimum, value shows "0 m"
- [ ] Visibility at 30m: slider at maximum, full gradient fill
- [ ] Form does not reset if user navigates between steps (values preserved)

---

## Accessibility Checks

- [ ] Close "×" button is keyboard focusable and responds to Enter/Space
- [ ] Visibility slider is keyboard controllable (arrow keys)
- [ ] Current selector buttons are keyboard navigable
- [ ] Date input has an associated label
- [ ] Notes textarea has an associated label
- [ ] RatingSheet star buttons have meaningful aria-labels (or descriptive text nearby)

---

## Sample Test Data

```typescript
// AddDiveForm props
const mockFormProps = {
  spotId: "spot-1",
  spotName: "Langøyene",
  authorAlias: "deepwater_dag",
  authorAvatarUrl: null,
  hasExistingRating: false,
  onSubmit: jest.fn(),
  onDismiss: jest.fn(),
};

// Expected submission (minimal — no notes, no photos)
const expectedMinimalLog = {
  spotId: "spot-1",
  authorAlias: "deepwater_dag",
  authorAvatarUrl: null,
  visibility: 8,
  current: 1 as const,
  notes: null,
  photos: [],
};

// RatingSheet props
const mockRatingProps = {
  spotName: "Langøyene",
  onRate: jest.fn(),
  onDismiss: jest.fn(),
};
```
