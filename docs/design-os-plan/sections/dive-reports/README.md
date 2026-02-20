# Dive Reports

## Overview

Dive Reports covers two complementary features: Dive Logs (repeatable condition records linked to a spot) and Spot Ratings (one permanent quality rating per user per spot). Together they give future divers both real-time condition signals and a stable quality score for each site.

## User Flows

- User opens a spot detail sheet and taps "Add Dive"
- Step 1: Enter visibility (0–30m slider), current (5-step labeled selector), optional date (defaults to today)
- Tap "Next" to continue to Step 2 (optional): add text notes and up to 5 photos
- After submitting: if user has not yet rated this spot, a follow-up `RatingSheet` appears
- User can dismiss the rating sheet with "Not now"
- Logged dives appear on the user's profile page

## Design Decisions

- `AddDiveForm` is a bottom sheet with two steps. Step 1 is required data; Step 2 (notes/photos) is optional.
- `RatingSheet` is shown after successful dive submission when `hasExistingRating` is false — it's separate from the form and can be skipped.
- The visibility slider shows actual meter value in a large monospace number; current strength uses a 5-button grid with visual bar indicators.

## Data Shapes

**Entities used:** `DiveLog`, `SpotRating`

## Visual Reference

See `screenshot.png` for the target UI design.

## Components Provided

- `AddDiveForm` — Multi-step bottom sheet for logging a dive
- `RatingSheet` — Follow-up bottom sheet for rating a spot after a dive

## Callback Props

| Callback | Triggered When |
|----------|----------------|
| `onSubmit` (AddDiveForm) | User taps "Submit Dive" on step 2 |
| `onDismiss` (AddDiveForm) | User closes the form |
| `onRate` (RatingSheet) | User selects a star rating |
| `onDismiss` (RatingSheet) | User taps "Not now" |
