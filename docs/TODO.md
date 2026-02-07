# TODO - Deferred Features

This document tracks features that are planned but deferred for future implementation.

## Avatar Upload with Supabase Storage

**Status:** Deferred
**Related Issue:** #52
**Reference:** USECASE.md §1.4 - CreateUploadUrl

### Current Implementation
Users can set their avatar by providing an external HTTPS URL to an existing image.

### Deferred Functionality
Full avatar upload workflow with pre-signed URLs:

1. **Endpoint:** `POST /uploads/create-url`
   - Request: `{ attachedTo: 'user', fileType: 'image/jpeg', sizeBytes: 524288 }`
   - Response: `{ uploadUrl: string, publicUrl: string, expiresAt: string }`

2. **Backend Requirements:**
   - Supabase Storage bucket configuration
   - Pre-signed URL generation
   - File type validation (JPEG, PNG, WebP)
   - Size limits (max 2MB for avatars)
   - Upload token/session validation

3. **Mobile Flow:**
   - User picks image from device
   - App requests upload URL from backend
   - App uploads directly to Supabase Storage via pre-signed URL
   - App sends `publicUrl` to backend via `PATCH /users/me`

4. **Security Considerations:**
   - Upload URLs expire after 15 minutes
   - File type whitelist enforcement
   - Content-type verification
   - Rate limiting on upload URL generation

### Implementation Checklist (when ready)
- [ ] Configure Supabase Storage bucket for avatars
- [ ] Create `uploads` module in backend
- [ ] Implement `CreateUploadUrlDto` with validation
- [ ] Add `UploadsService.createUploadUrl()`
- [ ] Add file type/size validation
- [ ] Implement upload expiry mechanism
- [ ] Create mobile image picker component
- [ ] Add upload progress UI
- [ ] Handle upload errors gracefully
- [ ] Add tests for upload workflow

### Why Deferred
- Requires Supabase Storage setup and configuration
- External URL approach sufficient for MVP
- Can be added incrementally without breaking changes

---

## iOS Norgeskart WMTS Support

**Status:** Deferred
**Related Issue:** #54
**Platform:** iOS only (Android works with UrlTile)

### Current Implementation
- iOS: Google Maps basemap (no Norgeskart tiles)
- Android: react-native-maps with Norgeskart WMTS UrlTile overlay

### Problem
`react-native-maps` UrlTile component does not render custom tiles on iOS - only Android.

### Solution Options (when implemented)

1. **WebView + Leaflet (Recommended)**
   - Platform-specific map component
   - iOS: WebView with Leaflet.js + Norgeskart WMTS layer
   - Android: Keep existing react-native-maps + UrlTile
   - Full Norgeskart tiles on both platforms

2. **Switch to MapLibre Native**
   - Replace react-native-maps with react-native-maplibre
   - Unified WMTS support on iOS and Android
   - Better tile layer control

### Implementation Checklist (when ready)
- [ ] Choose solution approach (WebView or MapLibre)
- [ ] If WebView: Create Leaflet HTML template with Norgeskart WMTS
- [ ] If WebView: Add react-native-webview dependency
- [ ] If WebView: Build platform-specific map component wrapper
- [ ] If MapLibre: Replace react-native-maps with react-native-maplibre
- [ ] If MapLibre: Migrate MapView props and controls
- [ ] Test on iOS simulator and device
- [ ] Verify Norgeskart attribution requirements met
- [ ] Update documentation

### Why Deferred
- Google Maps baseline acceptable for MVP
- Requires significant refactoring for full solution
- Non-blocking for initial launch
- Can be added without breaking existing functionality

---

## Other Deferred Features

### Batch Operations
**Status:** Not started
**Description:** Bulk updates for admin operations (e.g., mass delete, bulk approve)

### Advanced Search
**Status:** Not started
**Description:** Full-text search, filters, sorting across all entities

### Notifications
**Status:** Not started
**Description:** Push notifications for report comments, spot updates, etc.

---

**Last Updated:** 2025-11-03
**Maintained By:** Development Team
