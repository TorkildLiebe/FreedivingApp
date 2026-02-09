# Prisma & Database Best Practices

## 1. Schema Design

### Use meaningful names and conventions

```prisma
model DiveSpot {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(100)    // Set DB-level length constraints
  description String?  @db.Text            // Use Text for long content
  latitude    Float
  longitude   Float
  isDeleted   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdById String

  // Table mapping: PascalCase model -> snake_case table
  @@map("dive_spots")

  // Indexes (critical for query performance)
  @@index([createdById])
  @@index([isDeleted])
}
```

### Naming conventions

| Prisma | Database | Example |
|--------|----------|---------|
| Model name | PascalCase | `DiveSpot` |
| Field name | camelCase | `createdById` |
| Table name (@@map) | snake_case | `dive_spots` |
| Column name (@map) | snake_case | `created_by_id` |
| Enum values | UPPER_SNAKE | `CONSTANT_WEIGHT` |

### Always add these fields to every model

```prisma
model AnyEntity {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  isDeleted Boolean  @default(false)
  deletedAt DateTime?
}
```

## 2. Indexing Strategy

Indexes make queries fast. Without them, Postgres scans every row.

### When to add an index

```prisma
model DiveSpot {
  // Foreign keys - ALWAYS index
  @@index([createdById])

  // Fields you filter on frequently
  @@index([isDeleted])

  // Fields you sort by
  @@index([createdAt])

  // Compound index for common query patterns
  @@index([isDeleted, createdAt])  // "all active spots, newest first"

  // Unique constraints (automatically indexed)
  @@unique([latitude, longitude])
}
```

### Index rules of thumb
- **Always index:** Foreign keys, fields in WHERE clauses, fields in ORDER BY
- **Compound indexes:** Put the most selective column first
- **Don't over-index:** Each index slows down writes. Only index fields you actually query on
- **Unique constraints:** Use `@@unique` for business rules (e.g., one user per email)

### PostGIS spatial index

For geo queries, a regular index won't help. You need a spatial index:

```sql
-- In a migration file
CREATE INDEX idx_dive_spots_location ON dive_spots USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
);
```

## 3. Query Optimization

### Select only what you need

```typescript
// BAD - fetches all columns, all relations
const spots = await prisma.diveSpot.findMany({
  include: { reports: true, photos: true, createdBy: true },
});

// GOOD - only fetch what the endpoint needs
const spots = await prisma.diveSpot.findMany({
  select: {
    id: true,
    name: true,
    latitude: true,
    longitude: true,
    createdBy: {
      select: { displayName: true },
    },
  },
  where: { isDeleted: false },
});
```

### Pagination - always paginate lists

```typescript
// Offset-based pagination (simple, good for most cases)
async findAll(page: number, pageSize: number) {
  const [data, total] = await Promise.all([
    this.prisma.diveSpot.findMany({
      where: { isDeleted: false },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.diveSpot.count({
      where: { isDeleted: false },
    }),
  ]);

  return { data, total, page, pageSize };
}

// Cursor-based pagination (better for infinite scroll, large datasets)
async findAll(cursor?: string, limit: number = 20) {
  const spots = await this.prisma.diveSpot.findMany({
    where: { isDeleted: false },
    take: limit + 1, // fetch one extra to know if there are more
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = spots.length > limit;
  if (hasMore) spots.pop(); // remove the extra

  return {
    data: spots,
    nextCursor: hasMore ? spots[spots.length - 1].id : null,
  };
}
```

### Avoid N+1 queries

```typescript
// BAD - N+1: 1 query for spots + N queries for each spot's photos
const spots = await prisma.diveSpot.findMany();
for (const spot of spots) {
  spot.photos = await prisma.photo.findMany({ where: { spotId: spot.id } });
}

// GOOD - single query with include
const spots = await prisma.diveSpot.findMany({
  include: { photos: true },
});

// GOOD - two queries (sometimes better than one massive JOIN)
const spots = await prisma.diveSpot.findMany();
const spotIds = spots.map(s => s.id);
const photos = await prisma.photo.findMany({
  where: { spotId: { in: spotIds } },
});
```

## 4. Soft Deletes

We never hard-delete records. Always set `isDeleted: true`.

### The golden rule: ALWAYS filter `isDeleted: false`

```typescript
// In your repository, EVERY query must filter soft deletes
@Injectable()
export class DiveSpotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.diveSpot.findFirst({
      where: { id, isDeleted: false }, // ALWAYS include this
    });
  }

  async findAll() {
    return this.prisma.diveSpot.findMany({
      where: { isDeleted: false }, // ALWAYS include this
    });
  }

  async softDelete(id: string) {
    return this.prisma.diveSpot.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
```

### Consider Prisma middleware for automatic soft-delete filtering

```typescript
// Advanced: auto-filter soft deletes (evaluate if worth the complexity)
prisma.$use(async (params, next) => {
  if (params.action === 'findMany' || params.action === 'findFirst') {
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};
    if (params.args.where.isDeleted === undefined) {
      params.args.where.isDeleted = false;
    }
  }
  return next(params);
});
```

## 5. Transactions

### Use transactions for multi-step writes

```typescript
// When creating related records that must all succeed or all fail
async createSpotWithPhotos(dto: CreateDiveSpotDto, userId: string) {
  return this.prisma.$transaction(async (tx) => {
    const spot = await tx.diveSpot.create({
      data: {
        name: dto.name,
        latitude: dto.latitude,
        longitude: dto.longitude,
        createdById: userId,
      },
    });

    if (dto.photos?.length) {
      await tx.photo.createMany({
        data: dto.photos.map(p => ({
          url: p.url,
          caption: p.caption,
          spotId: spot.id,
        })),
      });
    }

    return spot;
  });
}
```

### When to use transactions
- Creating/updating multiple related records
- Any operation where partial completion would leave data inconsistent
- Transfer-like operations (subtract from A, add to B)

### When NOT to use transactions
- Single read queries
- Single create/update operations (already atomic)
- Read-only operations

## 6. Migrations Best Practices

### Migration naming

```bash
# Descriptive, imperative names
pnpm prisma migrate dev --name add-dive-spot-model
pnpm prisma migrate dev --name add-parking-to-dive-spot
pnpm prisma migrate dev --name add-spatial-index-to-spots

# BAD names
pnpm prisma migrate dev --name fix
pnpm prisma migrate dev --name update
```

### Migration workflow

1. **Edit `schema.prisma`** - make your changes
2. **Run `pnpm prisma validate`** - check for errors
3. **Run `pnpm prisma migrate dev --name description`** - creates and applies migration
4. **Review the generated SQL** - make sure it does what you expect
5. **Commit both the schema and migration file**

### Dangerous operations - handle with care

```sql
-- Adding a required column to existing table
-- Prisma will fail if rows exist. Solutions:

-- Option 1: Add with default
ALTER TABLE dive_spots ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';

-- Option 2: Add as nullable, backfill, then make required
ALTER TABLE dive_spots ADD COLUMN status VARCHAR(20);
UPDATE dive_spots SET status = 'active' WHERE status IS NULL;
ALTER TABLE dive_spots ALTER COLUMN status SET NOT NULL;
```

### Never edit applied migrations
Once a migration has been applied (committed and run on any environment), never modify it. Create a new migration instead.

## 7. Raw Queries (PostGIS)

Prisma doesn't natively support PostGIS functions. Use raw queries for spatial operations.

```typescript
// Find spots within radius
async findNearby(lat: number, lng: number, radiusMeters: number) {
  return this.prisma.$queryRaw<DiveSpot[]>`
    SELECT id, name, latitude, longitude,
      ST_Distance(
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      ) as distance
    FROM dive_spots
    WHERE is_deleted = false
      AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusMeters}
      )
    ORDER BY distance
  `;
}
```

### Raw query safety
- **Always use template literals** with `$queryRaw` - parameters are auto-escaped
- **Never string-concatenate** user input into queries
- **Type the result** - `$queryRaw<MyType[]>` for type safety on the result

```typescript
// SAFE - parameterized
const result = await prisma.$queryRaw`SELECT * FROM spots WHERE id = ${id}`;

// DANGEROUS - SQL injection risk
const result = await prisma.$queryRawUnsafe(`SELECT * FROM spots WHERE id = '${id}'`);
```

## 8. Repository Pattern

### One repository per entity

```typescript
@Injectable()
export class DiveSpotRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Standard CRUD methods
  async findById(id: string): Promise<DiveSpot | null> {
    return this.prisma.diveSpot.findFirst({
      where: { id, isDeleted: false },
    });
  }

  async create(data: CreateDiveSpotData): Promise<DiveSpot> {
    return this.prisma.diveSpot.create({ data });
  }

  // Domain-specific queries
  async findNearby(lat: number, lng: number, radiusMeters: number): Promise<DiveSpot[]> {
    // PostGIS query...
  }
}
```

### Why repositories?
- **Testability**: Mock the repository in service tests instead of PrismaService
- **Encapsulation**: Soft-delete filtering happens in one place
- **Changeability**: If you switch from Prisma to another ORM, only repositories change
- **Readability**: Service calls `spotRepo.findNearby()` instead of raw Prisma queries

## Quick Reference: Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgot `isDeleted: false` in query | Add it. Consider middleware for auto-filtering |
| No pagination on list endpoints | Add `take` and `skip` to all `findMany` calls |
| N+1 queries | Use `include` or batch queries with `in` |
| No indexes on foreign keys | Add `@@index([foreignKeyField])` |
| Editing applied migrations | Create new migration instead |
| Using `$queryRawUnsafe` | Use template literal `$queryRaw` |
| Missing `@updatedAt` | Add to every model |
| Giant `include` trees | Use `select` to pick only needed fields |

## Learn More

- [Prisma Best Practices](https://www.prisma.io/docs/guides)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PostgreSQL Indexing](https://www.postgresql.org/docs/current/indexes.html)
- [PostGIS Documentation](https://postgis.net/documentation/)
