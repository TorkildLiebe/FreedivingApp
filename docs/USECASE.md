# USECASE.md — DiveFreely (MVP)

Operational flows for the currently implemented backend. Validation rules live in **DOMAIN.md**.

**Conventions:**
- **IDs**: UUID v4
- **Timestamps**: ISO 8601 UTC
- **Auth**: JWT via guards; `actor.userId` and `actor.role` come from the verified token
- **Storage**: feature-specific pre-signed upload endpoints for avatars, spot photos, and dive-log photos

---

## 1) Auth & Profiles

### 1.1 GetMe
**Route**: `GET /users/me`  
**Intent**: Return the authenticated user's current profile.  
**Rules**: Auth required.  
**Output**: `{ id, email?, alias?, bio?, avatarUrl?, role, preferredLanguage, favoriteSpotIds, createdAt }`

### 1.2 UpdateMe
**Route**: `PATCH /users/me`  
**Intent**: Update profile fields for the authenticated user.  
**Input**: `{ alias?, bio?, avatarUrl?, preferredLanguage? }`  
**Rules**:
1. Auth required.
2. At least one field must be provided.
3. `alias` and `bio` follow `DOMAIN.md` length and no-emoji rules.
4. `preferredLanguage` must be `"en"` or `"no"`.
**Output**: updated profile payload matching `GetMe`.

### 1.3 CreateAvatarUploadUrl
**Route**: `POST /users/me/avatar/upload-url`  
**Intent**: Create a pre-signed upload target for avatar uploads.  
**Input**: `{ mimeType? }`  
**Rules**:
1. Auth required.
2. Upload is scoped to the authenticated user.
**Output**: `{ uploadUrl, publicUrl, expiresAt }`

### 1.4 GetMyStats
**Route**: `GET /users/me/stats`  
**Intent**: Return aggregate stats for the authenticated user.  
**Rules**: Auth required.  
**Output**: `{ totalReports, uniqueSpotsDived, favoritesCount, memberSince }`

### 1.5 GetMyActivity
**Route**: `GET /users/me/activity`  
**Intent**: Return the authenticated user's activity collections in one response.  
**Rules**: Auth required.  
**Output**:
- `diveReports`: array of `{ id, spotId, spotName, date, visibilityMeters, currentStrength, notesPreview? }`
- `createdSpots`: array of `{ id, name, createdAt, reportCount }`
- `favorites`: array of `{ id, spotId, spotName, latestVisibilityMeters?, latestReportDate? }`

### 1.6 AddFavoriteSpot
**Route**: `POST /users/me/favorites/:spotId`  
**Intent**: Add a spot to the authenticated user's favorites.  
**Rules**:
1. Auth required.
2. Spot must exist and not be soft-deleted.
3. Operation is idempotent.
**Output**: `{ favoriteSpotIds }`

### 1.7 RemoveFavoriteSpot
**Route**: `DELETE /users/me/favorites/:spotId`  
**Intent**: Remove a spot from the authenticated user's favorites.  
**Rules**:
1. Auth required.
2. Operation is idempotent.
**Output**: `{ favoriteSpotIds }`

**Planned, not implemented in the current API:**
- Public user profile lookup endpoint
- Generic upload-purpose endpoint
- Password change endpoint

---

## 2) Dive Spots

### 2.1 ListSpotSummaries
**Route**: `GET /spots/summaries`  
**Intent**: Return lightweight spot summaries for session-cached map rendering.  
**Rules**:
1. Auth required.
2. Return only non-deleted spots.
3. Payload is limited to marker summary fields: `id`, `title`, `centerLat`, `centerLon`.
**Output**: `SpotSummary[]`

### 2.2 ListSpotsByBBox
**Route**: `GET /spots`  
**Intent**: Return spots within a bounding box for map rendering.  
**Input**: `{ latMin, latMax, lonMin, lonMax, maxResults? }`  
**Rules**:
1. Auth required.
2. Reject antimeridian-spanning bounding boxes.
3. Default result limit is 300; hard cap is 1000.
**Output**: `{ items, count, truncated }`

### 2.3 GetSpotById
**Route**: `GET /spots/:id`  
**Intent**: Return spot detail for a single spot.  
**Rules**:
1. Auth required.
2. Spot must exist and not be soft-deleted.
3. Response includes an initial embedded slice of recent dive logs.
**Output**: full spot detail including rating aggregates and recent dive logs.

### 2.4 ListDiveLogsBySpot
**Route**: `GET /spots/:id/dive-logs`  
**Intent**: Return paginated dive logs for a spot.  
**Input**: `{ page?, limit? }`  
**Rules**:
1. Auth required.
2. Spot must exist and not be soft-deleted.
3. Default page is 1; default limit is 20; max limit is 50.
**Output**: `{ items, page, limit, total }`

### 2.5 CreateDiveSpot
**Route**: `POST /spots`  
**Intent**: Create a new dive spot owned by the authenticated user.  
**Input**: `{ title, description?, centerLat, centerLon, accessInfo?, parkingLocations? }`  
**Rules**:
1. Auth required.
2. Title, description, and access info follow `DOMAIN.md` text rules.
3. Max 5 parking locations; each must be within 5000m of the spot center.
4. Reject create if a non-deleted spot exists within 1000m.
**Output**: full spot detail.

### 2.6 UpdateDiveSpot
**Route**: `PATCH /spots/:id`  
**Intent**: Update mutable spot fields.  
**Input**: `{ title?, description?, accessInfo?, parkingLocations? }`  
**Rules**:
1. Auth required.
2. Only owner, moderator, or admin may update.
3. Spot center coordinates are immutable and not accepted by the DTO.
4. Provided text fields re-run validation.
**Output**: updated full spot detail.

### 2.7 CreateSpotPhotoUploadUrl
**Route**: `POST /spots/:id/photos/upload-url`  
**Intent**: Create a pre-signed upload target for a spot photo.  
**Input**: `{ mimeType? }`  
**Rules**:
1. Auth required.
2. Spot must exist and not be soft-deleted.
3. Reject if the spot already has 5 photos.
**Output**: `{ uploadUrl, publicUrl, expiresAt }`

### 2.8 AddPhotoToSpot
**Route**: `POST /spots/:id/photos`  
**Intent**: Persist a spot photo URL on the spot record.  
**Input**: `{ url }`  
**Rules**:
1. Auth required.
2. Spot must exist and not be soft-deleted.
3. URL must be valid and HTTPS.
4. Max 5 photos per spot; duplicate URLs are rejected case-insensitively.
**Output**: updated full spot detail.

### 2.9 UpsertSpotRating
**Route**: `POST /spots/:id/ratings`  
**Intent**: Create or update the current user's star rating for a spot.  
**Input**: `{ rating }` where `rating ∈ [1,5]`  
**Rules**:
1. Auth required.
2. Spot must exist and not be soft-deleted.
3. One rating per `(userId, spotId)` with upsert semantics.
**Output**: `{ id, spotId, userId, rating, averageRating, ratingCount, createdAt, updatedAt }`

### 2.10 SoftDeleteDiveSpot
**Route**: `DELETE /spots/:id`  
**Intent**: Soft-delete a spot.  
**Rules**:
1. Auth required.
2. Only owner, moderator, or admin may delete.
3. Operation is idempotent.
**Output**: `204 No Content`

**Planned, not implemented as separate endpoints:**
- Standalone `GET` endpoint for average rating

---

## 3) Dive Logs

### 3.1 CreateDiveLog
**Route**: `POST /dive-logs`  
**Intent**: Create a dive log for a spot.  
**Input**: `{ spotId, visibilityMeters, currentStrength, divedAt?, notes?, photoUrls? }`  
**Rules**:
1. Auth required.
2. Spot must exist and not be soft-deleted.
3. `visibilityMeters ∈ [0,30]`, `currentStrength ∈ [1,5]`.
4. `notes` follows length and no-emoji rules.
5. `photoUrls` accepts up to 5 URLs.
6. `divedAt` cannot be in the future.
**Output**: `{ diveLog, shouldPromptRating }`

### 3.2 CreateDiveLogPhotoUploadUrl
**Route**: `POST /dive-logs/photos/upload-url`  
**Intent**: Create a pre-signed upload target for a dive-log photo.  
**Input**: `{ spotId, mimeType? }`  
**Rules**:
1. Auth required.
2. Spot must exist and not be soft-deleted.
**Output**: `{ uploadUrl, publicUrl, expiresAt }`

### 3.3 UpdateDiveLog
**Route**: `PATCH /dive-logs/:id`  
**Intent**: Update mutable fields on an existing dive log.  
**Input**: `{ visibilityMeters?, currentStrength?, divedAt?, notes?, photoUrls? }`  
**Rules**:
1. Auth required.
2. Author may edit within 48 hours of creation.
3. Moderator and admin roles may edit regardless of the 48-hour window.
4. Other users are rejected.
5. Provided fields re-run the same validation used during creation.
**Output**: updated dive-log payload.

**Deferred documentation debt:**
- Duplicate recent report protection is planned but not enforced in the current implementation.

*Last updated: March 2026*
