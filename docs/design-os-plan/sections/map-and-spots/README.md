# Map & Spots

## Overview

The fullscreen map view for discovering and creating Norwegian freedive spots. Markers cluster at zoom-out; tapping a spot zooms the map in, highlights parking locations, and slides up a detail sheet.

## User Flows

- **Browse:** Pan/zoom map to explore markers and clusters
- **View spot:** Tap marker → map zooms to spot, parking shown in secondary color, detail sheet slides up
- **Tap cluster:** Map zooms to un-cluster → tap individual spot
- **Create spot:** Tap '+' FAB → pin drops at map center → user adjusts by panning/zooming → taps "Create Dive Spot" → form sheet opens (name, description, access info, photos, optional parking)
- **Search:** Type in floating search bar → map filters to matching spots
- **Favorite:** Heart icon in detail sheet toggles saved state
- **Add dive:** "＋ Add Dive" button in spot detail sheet triggers dive log creation flow
- **Rate spot:** Stars in detail sheet header open inline star picker

## Design Decisions

- The `MapAndSpots` component renders overlay UI (detail sheets, FAB, creation overlay) but NOT the map itself — the actual map tile layer is wired up by the implementation and passed via `AppShell`'s `mapContent` prop
- Spot marker and cluster rendering is also the implementor's responsibility; `onSpotPress` fires when a marker is tapped
- The `CreateSpotOverlay` simulates pin placement with a centered pin animation; real coordinate capture happens from the map's center position
- Frosted glass panels (`bg-white/85 backdrop-blur-xl`) float over the map throughout

## Data Shapes

**Entities used:** `DiveSpot`, `DiveReport`, `ParkingLocation`, `MapAndSpotsData`, `Position`, `Photo`, `LatestReport`, `CreateSpotPayload`

## Visual Reference

See `screenshot.png` for the target UI design.

## Components Provided

- `MapAndSpots` — Main overlay component managing FAB, detail sheets, and creation flow
- `SpotDetailSheet` — Bottom sheet showing spot info, reports, favorites, and rating
- `SpotReportRow` — Individual dive report row inside the detail sheet
- `CreateSpotOverlay` — Full-screen overlay for the spot creation flow (pin placement + form)

## Callback Props

| Callback | Triggered When |
|----------|----------------|
| `onSpotPress` | User taps a map marker |
| `onSpotDismiss` | User dismisses the detail sheet |
| `onFavoriteToggle` | User toggles the heart icon on a spot |
| `onSearch` | User types in the search bar |
| `onCreateSpotStart` | User taps the '+' FAB |
| `onCreateSpotConfirm` | User submits the spot creation form |
| `onCreateSpotCancel` | User cancels spot creation |
| `onAddDive` | User taps "＋ Add Dive" in the detail sheet |
| `onUpdateRating` | User submits a star rating for a spot |
