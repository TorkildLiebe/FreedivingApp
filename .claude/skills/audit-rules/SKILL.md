---
name: audit-rules
description: Validates code changes against DiveFreely domain invariants, business rules, and constraints from DOMAIN.md to ensure compliance
---

# Business Rules Audit Skill

Validates code against DiveFreely's critical domain invariants and business rules.

## When to Use This Skill

Use this skill to:
- Validate new features against domain rules before PR
- Review code changes for rule violations
- Audit DTOs, validation logic, and service methods
- Ensure constraints are enforced at all layers

## Critical Domain Rules

### Spot Rules

**Proximity constraint:**
- Minimum 1000m between spot centers
- Enforce in service layer before creation
- Check: `SpotsService.create()` calls `findNearbySpots(lat, lon, 1000)`

**Field constraints:**
- Title: max 80 chars, no emoji
- Description: max 2000 chars, optional
- Access info: max 1000 chars, optional
- Coordinates: WGS84, 6 decimals, lat [-90,90], lon [-180,180]
- Soft delete: use `isDeleted` flag, deleted spots return 404

### Parking Rules

**Constraints:**
- Max 5 parking per spot
- Must be within 5000m of spot
- Dedupe: < 2m proximity = same parking
- Label: max 100 chars, no emoji

**Enforcement:**
- DTO validation: `@ArrayMaxSize(5)`
- Service validation: calculate distance before create
- Repository: prevent duplicates in transaction

### Photo Rules

**Constraints:**
- Max 5 photos per spot/report
- Allowed formats: JPEG, PNG, WebP
- Pre-signed URLs only (no direct uploads)
- No EXIF scraping of GPS

**Enforcement:**
- DTO: `@ArrayMaxSize(5)`
- Upload service: validate MIME type
- Storage: use Supabase pre-signed URLs

### Report Rules

**Edit window:**
- Owners: 48 hours after creation
- Moderators/admins: bypass time limit
- After 48h: read-only for owners

**Enforcement:**
- Check `createdAt` timestamp in service
- Compare with `Date.now()` - 48h
- Throw `ForbiddenError` if exceeded

### User Rules

**Display name:**
- Max 50 chars
- No emoji
- Validate on create and update

**Roles:**
- `user` (default), `moderator`, `admin`
- Role escalation requires admin
- Cannot self-promote

## Validation Layers

### 1. DTO Layer (HTTP Boundary)

```typescript
// Validate structure, types, formats
export class CreateSpotDto {
  @IsString()
  @MaxLength(80)
  @ValidateNoEmoji()
  title: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => CreateParkingDto)
  @IsOptional()
  parking?: CreateParkingDto[];
}
```

### 2. Service Layer (Business Logic)

```typescript
// Validate domain rules, relationships
async create(dto: CreateSpotDto, userId: string) {
  // Check proximity
  const nearby = await this.repository.findNearbySpots(
    dto.latitude,
    dto.longitude,
    1000,
  );
  if (nearby.length > 0) {
    throw new SpotTooCloseError(nearby[0].distance);
  }

  // Validate parking distances
  if (dto.parking) {
    for (const parking of dto.parking) {
      const distance = calculateDistance(
        dto.latitude,
        dto.longitude,
        parking.latitude,
        parking.longitude,
      );
      if (distance > 5000) {
        throw new ParkingTooFarError(distance);
      }
    }
  }

  return this.repository.create(dto, userId);
}
```

### 3. Database Layer (Persistence)

```typescript
// Enforce constraints at DB level
model DiveSpot {
  id          String   @id @default(cuid())
  title       String   @db.VarChar(80)
  description String?  @db.VarChar(2000)
  accessInfo  String?  @db.VarChar(1000)
  latitude    Decimal  @db.Decimal(8, 6)
  longitude   Decimal  @db.Decimal(9, 6)
  isDeleted   Boolean  @default(false)

  parkingLocations ParkingLocation[] @relation("SpotParking")

  @@index([latitude, longitude])
  @@map("dive_spots")
}
```

## Audit Checklist

When reviewing code:

**For new endpoints:**
- [ ] DTOs have correct field length constraints
- [ ] No emoji validation applied where required
- [ ] Service enforces proximity rules
- [ ] Authorization checks before mutations
- [ ] Soft delete used (not hard delete)

**For database changes:**
- [ ] Column types match DTO constraints
- [ ] Indexes exist for spatial queries
- [ ] `isDeleted` field present
- [ ] Foreign keys properly defined

**For validation logic:**
- [ ] Coordinates validated at DTO layer
- [ ] Distance calculations use PostGIS or haversine
- [ ] Max counts enforced (5 parking, 5 photos)
- [ ] Time windows enforced (48h edit rule)

**For mobile forms:**
- [ ] Input maxLength matches domain rules
- [ ] Client-side validation mirrors backend
- [ ] Error messages reference domain constraints

**For vertical-slice report contract compliance:**
- [ ] Worker report includes all required top-level sections.
- [ ] Trailer contains required keys and valid values.
- [ ] `VERIFICATION: FAIL` is not paired with `RESULT: PASS`.
- [ ] UI reports (`MOBILE_UI_TOUCHED: true`) set `IOS_VERIFIED: true` and include:
  - `Design OS assets used:`
  - `Component mapping:`
  - `Design parity evidence:`
  - `Approved deviations:`
- [ ] Non-UI reports (`MOBILE_UI_TOUCHED: false`) set `IOS_VERIFIED: false`.

## Common Violations

❌ **Missing proximity check**
```typescript
// BAD - no proximity validation
async create(dto: CreateSpotDto) {
  return this.repository.create(dto);
}
```

✅ **Proximity enforced**
```typescript
// GOOD - validates proximity
async create(dto: CreateSpotDto) {
  const nearby = await this.repository.findNearbySpots(...);
  if (nearby.length > 0) {
    throw new SpotTooCloseError(...);
  }
  return this.repository.create(dto);
}
```

❌ **Hard delete**
```typescript
// BAD - permanent deletion
await prisma.diveSpot.delete({ where: { id } });
```

✅ **Soft delete**
```typescript
// GOOD - soft delete
await prisma.diveSpot.update({
  where: { id },
  data: { isDeleted: true },
});
```

## Quick Audit Commands

```bash
# Find hard deletes
grep -rn "\.delete(" apps/backend/src/modules/

# Find missing MaxLength decorators
grep -rn "@IsString()" apps/backend/src/ | grep -v "@MaxLength"

# Find emoji validation gaps
grep -rn "displayName\|title\|caption" apps/backend/src/ | grep -v "NoEmoji"

# Find proximity checks
grep -rn "findNearbySpots" apps/backend/src/modules/spots/
```

## Reference Files

- `domain-rules.md` - Complete list from DOMAIN.md with examples
- `validation-patterns.md` - DTO and service validation templates

## Related Skills

- `/backend-dev` - Backend development patterns
- `/test-backend` - Testing domain rules
- `/security` - Security validation

---

*Skill for validating domain rules (Issue #53)*
