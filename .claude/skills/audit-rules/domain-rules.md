# Complete Domain Rules Reference

Complete list of business rules and invariants from DOMAIN.md with validation examples.

## Spot Domain Rules

### Proximity (Critical)
- **Rule:** Minimum 1000m between spot centers
- **Validation:** PostGIS spatial query before create
- **Error:** `SpotTooCloseError` with actual distance
- **Code location:** `SpotsService.create()`

### Title
- **Max length:** 80 characters
- **No emoji:** ✅ Required
- **Required:** Yes
- **Validation:** `@MaxLength(80)`, `@ValidateNoEmoji()`

### Description
- **Max length:** 2000 characters
- **No emoji:** No restriction
- **Required:** No (optional)
- **Validation:** `@MaxLength(2000)`, `@IsOptional()`

### Access Info
- **Max length:** 1000 characters
- **No emoji:** ✅ Required
- **Required:** No (optional)
- **Validation:** `@MaxLength(1000)`, `@ValidateNoEmoji()`, `@IsOptional()`

### Coordinates
- **Format:** WGS84 (SRID 4326)
- **Precision:** 6 decimals (~0.1m)
- **Latitude range:** [-90, 90]
- **Longitude range:** [-180, 180]
- **Validation:** `@IsLatitude()`, `@IsLongitude()`
- **Database:** `Decimal(8,6)` and `Decimal(9,6)`

### Soft Delete
- **Rule:** Never hard delete user content
- **Field:** `isDeleted: Boolean`
- **Query behavior:** Deleted spots return 404
- **Validation:** All queries filter `isDeleted = false`

## Parking Domain Rules

### Max Count
- **Rule:** Max 5 parking per spot
- **Validation:** `@ArrayMaxSize(5)` in DTO
- **Enforcement:** Service layer count check

### Distance from Spot
- **Rule:** Within 5000m of spot
- **Validation:** Service calculates distance before create
- **Error:** `ParkingTooFarError` with actual distance

### Deduplication
- **Rule:** Parking < 2m apart = duplicate
- **Validation:** Service checks existing parking before create
- **Distance calc:** PostGIS `ST_Distance` or haversine

### Label
- **Max length:** 100 characters
- **No emoji:** ✅ Required
- **Required:** Yes
- **Validation:** `@MaxLength(100)`, `@ValidateNoEmoji()`

## Photo Domain Rules

### Max Count
- **Rule:** Max 5 photos per spot/report
- **Validation:** `@ArrayMaxSize(5)` in DTO
- **Enforcement:** Service and mobile UI

### Allowed Formats
- **Formats:** JPEG, PNG, WebP
- **Validation:** MIME type check on upload
- **File size:** Max 10MB (enforced by Supabase)

### Upload Method
- **Method:** Pre-signed URLs only
- **Storage:** Supabase Storage
- **Security:** No direct uploads, no public bucket access

### EXIF Data
- **Rule:** No GPS scraping from EXIF
- **Privacy:** Strip EXIF before storing
- **Validation:** Backend does not read EXIF GPS

## Report Domain Rules

### Edit Window (Owner)
- **Rule:** 48 hours after creation
- **Calculation:** `Date.now() - createdAt <= 48 * 60 * 60 * 1000`
- **After 48h:** Read-only for owner
- **Error:** `ForbiddenError` with message

### Edit Window (Mod/Admin)
- **Rule:** No time limit
- **Authorization:** Check `role in ['moderator', 'admin']`
- **Bypass:** Mods/admins can always edit

### Title
- **Max length:** 80 characters
- **No emoji:** ✅ Required
- **Required:** Yes
- **Validation:** `@MaxLength(80)`, `@ValidateNoEmoji()`

### Report Text
- **Max length:** 3000 characters
- **No emoji:** No restriction
- **Required:** Yes
- **Validation:** `@MaxLength(3000)`

## User Domain Rules

### Display Name
- **Max length:** 50 characters
- **No emoji:** ✅ Required
- **Required:** Yes
- **Default:** Email prefix on first login
- **Validation:** `@MaxLength(50)`, `@ValidateNoEmoji()`

### Email
- **Format:** Valid email
- **Required:** Yes (from JWT)
- **Unique:** Yes (enforced by auth provider)
- **Validation:** `@IsEmail()`

### Role
- **Values:** `user`, `moderator`, `admin`
- **Default:** `user`
- **Escalation:** Admin-only via dedicated endpoint
- **Self-promotion:** Forbidden (throw `ForbiddenError`)

### External ID
- **Source:** JWT `sub` claim
- **Format:** String (auth-provider|user-id)
- **Unique:** Yes (database constraint)
- **Immutable:** Cannot change after creation

## Validation Pattern Examples

### Custom No-Emoji Validator

```typescript
// apps/backend/src/common/validators/no-emoji.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

export function ValidateNoEmoji(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'noEmoji',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return true;
          return !emojiRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} cannot contain emoji`;
        },
      },
    });
  };
}
```

### Distance Calculation Utility

```typescript
// apps/backend/src/common/utils/distance.ts

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
```

### 48-Hour Edit Check

```typescript
// apps/backend/src/modules/reports/reports.service.ts

async update(
  id: string,
  dto: UpdateReportDto,
  userId: string,
  userRole: string,
): Promise<Report> {
  const report = await this.findById(id);

  // Check ownership
  if (report.createdBy !== userId && !['moderator', 'admin'].includes(userRole)) {
    throw new UnauthorizedError('You can only update your own reports');
  }

  // Check 48h window for non-mods
  if (
    report.createdBy === userId &&
    !['moderator', 'admin'].includes(userRole)
  ) {
    const hoursSinceCreation =
      (Date.now() - report.createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 48) {
      throw new ForbiddenError(
        'Reports can only be edited within 48 hours of creation',
      );
    }
  }

  return this.repository.update(id, dto);
}
```

---

*Reference file for audit-rules skill*
