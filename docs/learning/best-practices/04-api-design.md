# REST API Design Best Practices

## 1. URL Structure

### Use nouns, not verbs

```
GOOD:
GET    /dive-spots          # List spots
GET    /dive-spots/:id      # Get one spot
POST   /dive-spots          # Create spot
PATCH  /dive-spots/:id      # Update spot
DELETE /dive-spots/:id      # Delete spot

BAD:
GET    /getDiveSpots
POST   /createDiveSpot
POST   /dive-spots/delete/:id
```

### Nested resources for relationships

```
GET    /dive-spots/:id/reports       # Reports for a specific spot
POST   /dive-spots/:id/reports       # Create report for a spot
GET    /dive-spots/:id/photos        # Photos for a spot

# But don't nest too deep (max 2 levels)
BAD:   /dive-spots/:id/reports/:reportId/comments/:commentId
GOOD:  /reports/:reportId/comments/:commentId
```

### Plural nouns

```
GOOD:  /dive-spots, /users, /reports
BAD:   /dive-spot, /user, /report
```

### Kebab-case for URLs

```
GOOD:  /dive-spots, /parking-spots
BAD:   /diveSpots, /dive_spots, /DiveSpots
```

## 2. HTTP Methods

| Method | Purpose | Request Body | Response | Idempotent |
|--------|---------|-------------|----------|------------|
| GET | Read | None | Resource(s) | Yes |
| POST | Create | New resource | Created resource | No |
| PUT | Full replace | Full resource | Updated resource | Yes |
| PATCH | Partial update | Changed fields | Updated resource | Yes |
| DELETE | Remove | None | Empty or confirmation | Yes |

### Idempotent = safe to retry
GET, PUT, PATCH, DELETE should give the same result if called multiple times. POST creates a new resource each time.

### When to use PUT vs PATCH
- **PUT**: Client sends the complete resource. Missing fields are set to null/default
- **PATCH**: Client sends only changed fields. Missing fields are left as-is
- **Our convention**: Use PATCH for updates (more practical for mobile clients)

## 3. Request/Response Format

### Request DTOs (Input)

```typescript
// Create DTO - all required fields for creation
export class CreateDiveSpotDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(-90) @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180) @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

// Update DTO - all fields optional (PATCH semantics)
export class UpdateDiveSpotDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  // Note: lat/lng typically not updatable after creation
}
```

### Response DTOs (Output)

Don't return raw database entities. Map to response DTOs.

```typescript
// Response DTO - controls what the client sees
export class DiveSpotResponseDto {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string | null;
  createdAt: string;  // ISO 8601 string
  createdBy: {
    id: string;
    displayName: string;
  };
}

// In the service or controller
function toResponseDto(spot: DiveSpotWithCreator): DiveSpotResponseDto {
  return {
    id: spot.id,
    name: spot.name,
    latitude: spot.latitude,
    longitude: spot.longitude,
    description: spot.description,
    createdAt: spot.createdAt.toISOString(),
    createdBy: {
      id: spot.createdBy.id,
      displayName: spot.createdBy.displayName,
    },
  };
}
```

### Why response DTOs?
- **Security**: Never accidentally expose internal fields (password hashes, soft-delete flags)
- **Stability**: Internal model changes don't break the API contract
- **Control**: Format dates, hide nulls, flatten nested objects

## 4. Status Codes

### Success codes

| Code | When | Example |
|------|------|---------|
| 200 OK | Successful read/update | GET /spots, PATCH /spots/:id |
| 201 Created | Resource created | POST /spots |
| 204 No Content | Successful delete | DELETE /spots/:id |

### Client error codes

| Code | When | Example |
|------|------|---------|
| 400 Bad Request | Invalid input | Missing required field, invalid format |
| 401 Unauthorized | Not authenticated | Missing or invalid token |
| 403 Forbidden | Not authorized | User can't edit another's report |
| 404 Not Found | Resource doesn't exist | Spot ID not found |
| 409 Conflict | Business rule conflict | Spot too close to another |
| 422 Unprocessable Entity | Valid syntax, invalid semantics | Valid JSON but invalid business data |

### Server error codes

| Code | When |
|------|------|
| 500 Internal Server Error | Unexpected server error (bug, DB down) |

### Our error mapping convention

```typescript
// Domain errors -> HTTP codes (defined in DOMAIN.md)
SpotNotFoundError    -> 404
UserNotFoundError    -> 404
InvalidInputError    -> 400
SpotTooCloseError    -> 400
EditWindowExpired    -> 403
DuplicateSpotError   -> 409
UnauthorizedError    -> 401
ForbiddenError       -> 403
```

## 5. Error Response Format

### Consistent error shape

```json
{
  "statusCode": 400,
  "message": "Spot must be at least 1000m from existing spots",
  "error": "Bad Request"
}

// Validation errors (multiple fields)
{
  "statusCode": 400,
  "message": [
    "name must be a string",
    "latitude must be between -90 and 90"
  ],
  "error": "Bad Request"
}
```

### Rules
- Always include `statusCode`, `message`, `error`
- `message` is human-readable (the mobile app may display it)
- Never include stack traces, SQL queries, or internal details
- For validation errors, list all failing fields (not just the first)

## 6. Pagination

### Request format

```
GET /dive-spots?page=1&pageSize=20
GET /dive-spots?cursor=abc123&limit=20
```

### Response format (offset-based)

```json
{
  "data": [
    { "id": "...", "name": "..." },
    { "id": "...", "name": "..." }
  ],
  "meta": {
    "total": 142,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

### Response format (cursor-based)

```json
{
  "data": [
    { "id": "...", "name": "..." }
  ],
  "meta": {
    "nextCursor": "abc123",
    "hasMore": true
  }
}
```

### Which to use?
- **Offset**: Simpler, allows jumping to specific pages. Good for admin panels.
- **Cursor**: Better performance on large datasets, no skipped/duplicate items. Good for infinite scroll.
- **Our recommendation**: Cursor-based for mobile (infinite scroll pattern), offset for admin.

### Default limits

```typescript
// Always enforce limits
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@IsOptional()
@IsInt()
@Min(1)
@Max(100)
pageSize: number = 20;
```

## 7. Filtering & Sorting

### Query parameters for filtering

```
GET /dive-spots?minDepth=10&maxDepth=30
GET /dive-spots?near=60.39,5.32&radius=5000
GET /reports?spotId=abc123&status=approved
```

### Query parameters for sorting

```
GET /dive-spots?sort=createdAt&order=desc
GET /dive-spots?sort=-createdAt          # prefix with - for descending
```

### Whitelist allowed sort fields
Never let users sort by arbitrary fields (performance risk, information leakage).

```typescript
const ALLOWED_SORT_FIELDS = ['createdAt', 'name', 'depth'] as const;

@IsOptional()
@IsIn(ALLOWED_SORT_FIELDS)
sort?: string = 'createdAt';
```

## 8. API Versioning

### Options (listed by complexity)

1. **No versioning** (our current approach for MVP) - just make non-breaking changes
2. **URL versioning**: `/api/v1/spots`, `/api/v2/spots`
3. **Header versioning**: `Accept: application/vnd.freediving.v1+json`

### Non-breaking changes (safe without versioning)
- Adding new optional fields to response
- Adding new endpoints
- Adding new optional query parameters

### Breaking changes (need versioning or migration)
- Removing or renaming fields
- Changing field types
- Changing URL structure
- Changing required fields

**For MVP**: Don't version. Make non-breaking changes. Revisit when you have real users.

## 9. Auth Endpoints Convention

```
POST /auth/signup          # Create account
POST /auth/login           # Get tokens
POST /auth/refresh         # Refresh token
POST /auth/logout          # Invalidate session
POST /auth/forgot-password # Send reset email
POST /auth/reset-password  # Set new password
GET  /auth/me              # Get current user (alias: GET /users/me)
```

Note: Our auth is handled by Supabase, so most of these are Supabase SDK calls from the mobile app, not our backend endpoints.

## 10. Common Patterns

### "Me" endpoints

```typescript
// Instead of requiring the client to know their user ID
GET /users/me              // Get current user profile
PATCH /users/me            // Update own profile
GET /users/me/reports      // Get my reports
```

### Bulk operations (if needed)

```typescript
// Batch create
POST /dive-spots/batch
Body: { items: [{ ... }, { ... }] }

// Batch delete
DELETE /dive-spots/batch
Body: { ids: ["abc", "def"] }
```

### Health check

```
GET /health
Response: { "status": "ok", "timestamp": "2024-01-15T..." }
```

## Quick Reference

| Decision | Our Choice | Why |
|----------|-----------|-----|
| URL style | `/kebab-case` plural nouns | REST convention |
| Update method | PATCH | Partial updates are more practical |
| Pagination | Cursor for mobile, offset for admin | Performance + UX |
| Error format | `{ statusCode, message, error }` | NestJS default, consistent |
| Versioning | None (MVP) | Premature for alpha |
| Auth | Supabase handles it | Don't reinvent auth |
| Date format | ISO 8601 (`2024-01-15T12:00:00Z`) | Universal standard |
| ID format | UUID v4 | Non-sequential, globally unique |

## Learn More

- [REST API Design Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)
- [JSON API Spec](https://jsonapi.org/) (for reference, we don't follow it strictly)
