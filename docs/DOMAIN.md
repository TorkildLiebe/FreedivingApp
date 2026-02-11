# DOMAIN.md — DiveFreely (MVP)

Domain entities, value objects, invariants, errors. See **USECASE.md** for operational flows.

---

## 1) Global Principles

| Principle | Rule |
|-----------|------|
| Domain independence | No DB/Auth/Storage deps in domain code |
| Auth source | JWT `sub` authoritative |
| Soft delete | Deleted = not found (404) |
| Text normalization | Trim, collapse spaces |
| Coordinates | WGS84, 6 decimals |
| Character policy | No emoji in user text |
| Errors→HTTP | 400: Invalid* \| 401: auth \| 403: Forbidden \| 404: *NotFound* \| 409: Conflict |

---

## 2) Entities & Value Objects

### 2.1 User
- **Fields**: `id`, `externalId (sub)`, `email?`, `displayName?`, `avatarUrl?`, `role ∈ {user,moderator,admin}`, `preferredLanguage ∈ {"en","no"}`, `favoriteSpotIds: String[]`, timestamps.
- **Rules**:
  - `displayName`: 1..120, no emoji.
  - `avatarUrl`: https-only; null if blank.
  - New users: role=user, language="no".
  - `favoriteSpotIds`: unique, only valid spot IDs.

### 2.2 DiveSpot
- **Fields**:  
  `id`, `title`, `description`, `centerLat`, `centerLon`, `createdById`,  
  `accessInfo?`, `parkingLocations: ParkingLocation[0..5]`,  
  `isDeleted`, `deletedAt?`, timestamps,  
  `shareUrl?`, `shareableAccessInfo?`.
- **Invariants**:
  - `title`: 1..80  
  - `description`: 0..2000  
  - `accessInfo`: 0..1000; null if blank  
  - `centerLat ∈ [-90,90]`, `centerLon ∈ [-180,180]` (immutable)  
  - `parkingLocations`: each within 5000 m of center; **max 5**; reject near-duplicate (<2 m).  
  - **Proximity uniqueness**: reject create if any non-deleted spot center within 1000 m.  
- **Share metadata**:
  - `shareUrl?`: canonical public URL (if available).  
  - `shareableAccessInfo?`: boolean; true if `accessInfo` can be included in shares.

### 2.3 ParkingLocation (value object)
- **Fields**:  
  - `id?` UUID v4  
  - `lat`, `lon`  
  - `label?` (0..100) e.g. “Parking by pier”.
- **Rules**:  
  - valid lat/lon; WGS84; round 6 decimals.  
  - within 5000 m of parent spot center.  
  - max 5 per spot.

### 2.4 DiveReport
- **Fields**: `id`, `spotId`, `authorId`, `visibilityMeters`, `currentStrength`, `rating?`, `divedAt`, `isDeleted`, `deletedAt?`, timestamps.  
- **Invariants**:
  - `visibilityMeters ∈ [0,60]`
  - `currentStrength ∈ [1,5]`
  - `rating? ∈ [1,5]`
  - `divedAt`: not future
  - `spotId` references existing spot
  - `authorId` immutable
  - Edit window 48 h (mod/admin bypass)

### 2.5 PhotoAttachment
- **Fields**: `id`, `attachedTo {'report'|'spot'}`, `attachedToId`, `uploadedById`, `url`, `caption?`, timestamps, `isDeleted`, `deletedAt?`.
- **Rules**:
  - ≤5 per report, ≤5 per spot.
  - `url`: https:// only, dedupe case-insensitive.
  - `caption`: 0..140, no emoji.

### 2.6 Geo Utilities
- `distanceMeters(lat1,lon1,lat2,lon2)`
- `isWithinRadius(centerLat,centerLon,lat,lon,radiusMeters)`
- `validateBBox(latMin,latMax,lonMin,lonMax)` — rejects antimeridian.

---

## 3) Error Taxonomy

Validation:  
`InvalidTitleError`, `InvalidDescriptionError`, `InvalidAccessInfoError`,  
`InvalidCoordinatesError`, `InvalidParkingLocationError`,  
`InvalidVisibilityError`, `InvalidCurrentStrengthError`, `InvalidRatingError`, `InvalidDiveTimeError`,  
`InvalidPhotoUrlError`, `TooManyPhotosError`, `EmojiNotAllowedError`,  
`InvalidDisplayNameError`, `InvalidPreferredLanguageError`,  
`InvalidBBoxError`, `InvalidPaginationCursorError`.

Ownership/permissions: `ForbiddenError`.  
Existence: `SpotNotFoundOrDeletedError`, `ReportNotFoundOrDeletedError`.  
Conflicts: `TooCloseToExistingSpotError`, `DuplicateRecentReportError`.

---

## 4) Ports (Domain Interfaces)

Repository interfaces abstract persistence. Key methods:
- `UserRepository`: `findByExternalId`, `create`, `addFavorite`
- `DiveSpotRepository`: `create`, `update`, `softDelete`, `findById`, `findCentersWithinRadius`, `listByBBox`
- `DiveReportRepository`: `create`, `update`, `findById`, `listRecentByAuthorAndSpot`
- `PhotoAttachmentRepository`: `create`, `listByReport`, `listBySpot`, `countByReport`, `countBySpot`

*Actual interfaces live in module code.*

---

## 5) Use-Case Mapping

Operational flows in **USECASE.md**:
- Spots: Create, Update, SoftDelete, ListByBBox, GetById, GetWithReports, AddPhotoToSpot
- Reports: Create, Update, AddPhoto
- Favorites: Add, Remove, List
- Profiles: GetMe, GetUserProfile, UpdateMyProfile, CreateUploadUrl

*Last updated: February 2026*
