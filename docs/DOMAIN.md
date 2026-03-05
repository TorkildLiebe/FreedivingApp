# DOMAIN.md — DiveFreely (MVP)

Domain entities, invariants, and business constraints for the currently implemented MVP.

---

## 1) Global Principles

| Principle | Rule |
|-----------|------|
| Domain independence | Core rules should remain decoupled from DB/Auth/Storage details |
| Auth source | JWT `sub` is authoritative for identity |
| Soft delete | Deleted resources are treated as not found |
| Text normalization | Services trim text; blank optional text becomes `null` where applicable |
| Coordinates | WGS84 latitude/longitude ranges |
| Character policy | Restricted user-facing text fields must not contain emoji |
| Errors→HTTP | 400 validation, 401 auth, 403 forbidden, 404 not found, 409 conflict |

---

## 2) Entities & Value Objects

### 2.1 User
- **Fields**: `id`, `externalId`, `email?`, `alias?`, `bio?`, `avatarUrl?`, `role`, `preferredLanguage`, `favoriteSpotIds`, timestamps.
- **Rules**:
  - `alias`: 1..120, no emoji.
  - `bio`: 0..300, no emoji; null if blank.
  - `avatarUrl`: nullable.
  - New users default to `role = user` and `preferredLanguage = "no"`.
  - `favoriteSpotIds` contains unique active spot IDs after application-level filtering.

### 2.2 DiveSpot
- **Fields**:
  `id`, `title`, `description`, `centerLat`, `centerLon`, `createdById`,
  `accessInfo?`, `parkingLocations`, `photoUrls`, `averageVisibilityMeters?`,
  `averageRating?`, `reportCount`, `latestReportAt?`, `shareUrl?`,
  `shareableAccessInfo?`, soft-delete fields, timestamps.
- **Rules**:
  - `title`: 1..80, no emoji.
  - `description`: 0..2000, no emoji.
  - `accessInfo`: 0..1000, no emoji; null if blank.
  - `centerLat ∈ [-90,90]`, `centerLon ∈ [-180,180]` and immutable after create.
  - `parkingLocations`: max 5; each within 5000m of center; reject near-duplicate parking entries closer than 2m.
  - Reject create if another non-deleted spot exists within 1000m.
  - `photoUrls`: max 5, HTTPS URLs, duplicate URLs rejected case-insensitively.

### 2.3 ParkingLocation
- **Fields**: `id`, `lat`, `lon`, `label?`
- **Rules**:
  - valid lat/lon
  - `label`: 0..100
  - must be within 5000m of the parent spot center

### 2.4 DiveLog
- **Fields**: `id`, `spotId`, `authorId`, `visibilityMeters`, `currentStrength`, `notes?`, `photoUrls`, `divedAt`, soft-delete fields, timestamps.
- **Rules**:
  - `visibilityMeters ∈ [0,30]`
  - `currentStrength ∈ [1,5]`
  - `notes`: 0..500, no emoji; null if blank.
  - `photoUrls`: max 5, valid URLs.
  - `divedAt`: not in the future.
  - Author may edit within 48h.
  - Moderator/admin may edit beyond 48h.

### 2.5 SpotRating
- **Fields**: `id`, `spotId`, `userId`, `rating`, `createdAt`, `updatedAt`
- **Rules**:
  - `rating ∈ [1,5]`
  - one rating per `(userId, spotId)`
  - upsert semantics on repeated submissions

### 2.6 Geo Utilities
- Bounding boxes reject antimeridian-spanning queries.
- Distance checks back spot proximity and parking validation.

---

## 3) Error Taxonomy

Validation:
`InvalidBBoxError`, `InvalidParkingLocationError`, `InvalidPhotoUrlError`,
`InvalidDiveLogError`, `TooManyPhotosError`

Ownership/permissions:
`ForbiddenError`

Existence:
`SpotNotFoundOrDeletedError`, `DiveLogNotFoundError`

Conflicts:
`TooCloseToExistingSpotError`, duplicate spot-photo URL, duplicate parking location

Note:
- No-emoji validation is enforced through DTO validation and returns standard validation errors rather than a dedicated domain error class.
- Duplicate recent report protection is planned but not implemented.

---

## 4) Use-Case Mapping

Current operational flows in **USECASE.md**:
- Profiles: `GetMe`, `UpdateMe`, `CreateAvatarUploadUrl`, `GetMyStats`, `GetMyActivity`
- Favorites: `AddFavoriteSpot`, `RemoveFavoriteSpot`
- Spots: `ListSpotSummaries`, `ListSpotsByBBox`, `GetSpotById`, `ListDiveLogsBySpot`, `CreateDiveSpot`, `UpdateDiveSpot`, `CreateSpotPhotoUploadUrl`, `AddPhotoToSpot`, `UpsertSpotRating`, `SoftDeleteDiveSpot`
- Dive logs: `CreateDiveLog`, `CreateDiveLogPhotoUploadUrl`, `UpdateDiveLog`

Deferred / planned, not part of the current implemented contract:
- public user profile endpoint
- password change flow
- standalone photo attachment model with captions
- duplicate recent report protection

*Last updated: March 2026*
