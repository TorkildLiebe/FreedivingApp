# UI Data Shapes

These types define the shape of data that the UI components expect to receive as props. They represent the **frontend contract** — what the components need to render correctly.

How you model, store, and fetch this data on the backend is an implementation decision. You may combine, split, or extend these types to fit your architecture.

## Entities

- **Position** — Lat/lng coordinate (used in: map-and-spots)
- **Photo** — Image with URL and optional caption (used in: map-and-spots)
- **ParkingLocation** — Parking spot near a dive site (used in: map-and-spots)
- **LatestReport** — Summary of the most recent dive report for a spot (used in: map-and-spots)
- **DiveSpot** — Named dive location with GPS, description, ratings, and reports (used in: map-and-spots)
- **DiveReport** — Individual dive log entry for a spot (used in: map-and-spots)
- **MapAndSpotsData** — Root data container for the map view (used in: map-and-spots)
- **CreateSpotPayload** — Data submitted when creating a new dive spot (used in: map-and-spots)
- **CurrentLabel** — String union for current strength labels (used in: dive-reports)
- **DiveLog** — Post-dive log with visibility, current, and optional notes/photos (used in: dive-reports)
- **SpotRating** — User's quality rating for a spot (used in: dive-reports)
- **AuthUser** — Authenticated user profile (used in: auth-and-profiles)
- **DiveReportPhoto** — Photo attached to a dive report (used in: auth-and-profiles)
- **DiveReportSummary** — Summary of a dive report shown on user profile (used in: auth-and-profiles)
- **CreatedSpot** — Dive spot created by the user (used in: auth-and-profiles)
- **FavoriteSpot** — Saved dive spot on user's profile (used in: auth-and-profiles)
- **ActivityStats** — Aggregate stats for user profile header (used in: auth-and-profiles)
- **EditProfilePayload** — Data submitted when editing user profile (used in: auth-and-profiles)
- **ChangePasswordPayload** — Data submitted when changing password (used in: auth-and-profiles)

## Per-Section Types

Each section includes its own `types.ts` with the full interface definitions:

- `sections/map-and-spots/types.ts`
- `sections/dive-reports/types.ts`
- `sections/auth-and-profiles/types.ts`

## Combined Reference

See `overview.ts` for all entity types aggregated in one file.
