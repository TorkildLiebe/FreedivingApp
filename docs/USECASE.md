# USECASE.md — DiveFreely (MVP)

Operational flows. Validation in **DOMAIN.md §2**. Errors in **DOMAIN.md §3**.

**Conventions:**
- **IDs**: UUID v4 | **Timestamps**: ISO 8601 UTC
- **Auth**: JWT via guards; `actor.userId`/`actor.role` from token
- **Storage**: Pre-signed upload via `CreateUploadUrl`

---

## 1) Auth & Profiles

### 1.1 GetMe
**Intent**: Return current authenticated user profile & role.  
**Input**: *(none)* — uses JWT from Authorization header.  
**Rules**: Auth required.  
**Output**: `{ id, displayName?, avatarUrl?, email?, role, preferredLanguage }`  
**Errors**: 401 if no/invalid token.

### 1.2 GetUserProfile
**Intent**: Public profile lookup by `userId`.  
**Input**: `{ userId }`  
**Rules**: Public; returns only non-sensitive fields.  
**Output**: `{ id, displayName, avatarUrl, createdAt }`  
**Errors**: `UserNotFoundError` → 404

### 1.3 UpdateMyProfile
**Intent**: Let a user edit their display name, avatar, or language preference.  
**Input**: `{ displayName?, avatarUrl?, preferredLanguage? }`  
**Rules**:
- Auth required; user can only edit their own profile.
- Apply `DOMAIN.md` §2.1 rules (displayName, avatarUrl normalization, preferredLanguage must be "en" or "no").
**Output**: updated user profile.  
**Errors**: `InvalidDisplayNameError`, `InvalidPhotoUrlError`, `InvalidPreferredLanguageError`

### 1.4 CreateUploadUrl
**Intent**: Get a pre-signed upload URL + a final public URL for client-side uploads.  
**Input**: `{ purpose: "reportPhoto" | "spotPhoto" | "avatar" }`  
**Rules**:
- Auth required.
- Server responds with `{ uploadUrl, publicUrl, expiresAt }`.
- Ensure the upload purpose maps to the correct storage bucket (per bucket policy).
**Output**: `{ uploadUrl, publicUrl, expiresAt }`  
**Errors**: `InvalidUploadPurposeError`

---

## 2) Dive Spots

### 2.1 CreateDiveSpot
**Input**: `{ title, description, centerLat, centerLon, accessInfo?, parkingLocations? }`  
**Preconditions**: Auth required; server sets `createdById = actor.userId`.  
**Steps**:
1. Normalize text fields; validate all fields per `DOMAIN.md` §2.2/§2.3.
2. Validate `parkingLocations` (0..5 entries, each within 5000 m of center).
3. Proximity guard: if any non-deleted spot’s center is within 1000 m → 409 Conflict.
4. Persist new spot and return the full spot.

### 2.2 UpdateDiveSpot
**Input**: `{ spotId, title?, description?, accessInfo?, parkingLocations? }`  
**Preconditions**: Spot exists & not deleted; user is owner or a moderator/admin.  
**Steps**:
1. Reject attempts to change `centerLat`/`centerLon` (they are immutable).
2. Re-validate text and parking fields; update spot; set `updatedAt = now`.

### 2.3 SoftDeleteDiveSpot
**Input**: `{ spotId }`  
**Preconditions**: Spot exists; user is owner or moderator/admin.  
**Steps**: Mark the spot as soft-deleted. Operation is idempotent; after deletion the spot is treated as not found (404 on access).

### 2.4 ListSpotsByBBox
**Input**: `{ latMin, latMax, lonMin, lonMax, maxResults? }`  
**Steps**:
1. Validate bounding box (`DOMAIN.md` §2.6); reject if it spans the antimeridian.
2. Use default and max limits for results (default 300, cap 1000).
3. Query spots within BBOX (excluding deleted); return `{ items, count, truncated }` with minimal spot info.

### 2.5 GetSpotById
**Input**: `{ spotId }`  
**Steps**: Load the spot by ID (ensure not deleted) and return it, or 404 if not found.

### 2.6 GetSpotWithReports
**Input**: `{ spotId, limit? (default 10; max 50) }`  
**Steps**:
1. Load spot or return 404 if not found/deleted.
2. Load recent reports for that spot (exclude deleted, order by `divedAt DESC`, apply limit).
3. Return `{ spot, reports: { items, count, truncated } }`.

### 2.7 AddPhotoToSpot
**Input**: `{ spotId, url, caption? }`  
**Preconditions**: Spot exists & not deleted; user is owner or moderator/admin.  
**Steps**:
1. Validate `url` and `caption` per `DOMAIN.md` §2.5.
2. Enforce max 5 photos per spot and prevent duplicate URL (case-insensitive) for this spot.
3. Persist the photo attachment record and return it.

---

## 3) Dive Reports

### 3.1 CreateDiveReport
**Input**: `{ spotId, visibilityMeters, currentStrength, divedAt, rating?, remark }`  
**Preconditions**: Spot exists & not deleted; auth required.  
**Steps**:
1. Validate ranges (`visibilityMeters`, `currentStrength`, and `rating` if provided) and ensure `divedAt` is not in the future (per `DOMAIN.md` §2.4).
2. Anti-duplication check: if the same user posted a report for the same spot within the last ~2 hours with a similar visibility (Δ ≤ 1.0) and identical `currentStrength` → 409 Conflict.
3. Persist the new report with `authorId = actor.userId` (include `rating` if provided) and return the report.

### 3.2 UpdateDiveReport
**Input**: `{ reportId, visibilityMeters?, currentStrength?, divedAt?, rating? }`  
**Preconditions**: Report exists & not deleted; user is author (within 48h of creation) or a moderator/admin.  
**Steps**:
1. Validate all provided fields per `DOMAIN.md` §2.4 (including `rating` if present); ensure immutable fields (`spotId`, `authorId`) are not changed.
2. Re-run the anti-duplication check if any key values (visibility, currentStrength, divedAt) have changed.
3. Persist the changes (`updatedAt = now`; update `rating` if provided) and return the updated report.

### 3.3 AddPhotoToReport
**Input**: `{ reportId, url, caption? }`  
**Preconditions**: Report exists & not deleted; user is author or moderator/admin.  
**Steps**:
1. Validate `url` and `caption` per `DOMAIN.md` §2.5.
2. Enforce max 5 photos per report and prevent duplicate URL (case-insensitive) for this report.
3. Persist the photo attachment and return it.

---

## 4) Favorites

### 4.1 AddFavoriteSpot
**Intent**: Mark a dive spot as a favorite for the current user.  
**Input**: `{ spotId }`  
**Preconditions**: Spot exists & not deleted; auth required.  
**Steps**:
1. Ensure the spot exists and is not soft-deleted (if not, throw `SpotNotFoundOrDeletedError`).
2. If the spot is already in the user’s favorites list, do nothing (idempotent).
3. Otherwise, add the spot’s ID to the user’s favorites list.
4. Persist the updated user record (favoriteSpotIds).
5. Return success.

### 4.2 RemoveFavoriteSpot
**Intent**: Remove a dive spot from the current user’s favorites.  
**Input**: `{ spotId }`  
**Preconditions**: Auth required.  
**Steps**:
1. If the spotId is in the user’s favorites list, remove it.
2. If it’s not in the list, do nothing (idempotent).
3. Persist the updated user record.
4. Return success.

### 4.3 ListMyFavoriteSpots
**Intent**: Retrieve the current user’s favorite dive spots.  
**Input**: *(none)* — uses JWT for authentication.  
**Preconditions**: Auth required.  
**Steps**:
1. Read the user’s `favoriteSpotIds` list.
2. Fetch each corresponding spot (ignore any that are deleted or missing).
3. Return the list of favorite spots.

**Output**: An array of dive spot objects that the user has favorited.  

*Last updated: February 2026*
