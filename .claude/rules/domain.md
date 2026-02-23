---
paths:
  - "apps/backend/**"
  - "apps/mobile/**"
---
# Domain Rules

Source of truth remains `docs/DOMAIN.md`. This file duplicates operationally critical constraints for implementation safety.

## Core Invariants

- Spot proximity: minimum 1000m between spot centers.
- Parking: max 5, each within 5000m of spot center, dedupe if distance < 2m.
- Photos: max 5 per spot and max 5 per report.
- Report edits: owner can edit within 48h; moderator/admin bypasses window.
- Visibility range: 0-30m (not 60m).
- Text policy: no emoji in restricted user-facing fields.
- User fields: `alias` (1-120, no emoji), `bio` (0-300, no emoji).
- Report notes: 0-500 chars, no emoji; null if blank.
- SpotRating: rating ∈ [1,5], unique per (userId, spotId), upsert semantics.

## Data and Validation

- Coordinates are WGS84 with valid lat/lon ranges.
- Apply server-side validation even if mobile enforces input constraints.
- Keep domain errors explicit and mappable to stable API error responses.

## Documentation Consistency

- Do not remove business rules from `/docs`.
- When constraints change, update code, tests, and docs together.
