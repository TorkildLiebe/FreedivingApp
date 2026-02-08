# Supabase, PostgreSQL, and PostGIS

## What is PostgreSQL?

PostgreSQL (often just "Postgres") is a **database** - it stores and retrieves your data. Think of it as a massive, super-fast spreadsheet that can handle millions of rows and complex queries.

Unlike a spreadsheet, databases:
- Handle many users reading/writing at the same time
- Enforce rules on data (e.g., "email must be unique")
- Can query data in complex ways (e.g., "find all dive spots within 10km of this point")
- Keep data safe even if the server crashes

## What is Supabase?

Supabase is a **platform that wraps PostgreSQL** and adds useful extras:
- A managed Postgres database
- User authentication (login/signup)
- File storage (for photos)
- Realtime subscriptions
- Auto-generated REST API

For us, the main value is: **Supabase gives us Postgres + Auth + Storage without managing servers ourselves.**

### Local Development with Supabase

Instead of connecting to a remote database during development, we run Supabase **locally** using Docker:

```bash
# Start local Supabase (runs Postgres + all services in Docker containers)
supabase start

# This gives you:
#   - Postgres on localhost:54322
#   - Supabase Studio (web UI) on localhost:54323
#   - Auth service, storage, etc.

# Stop it when you're done
supabase stop

# Reset database (wipes all data, re-runs migrations)
supabase db reset
```

When you run `supabase start`, it prints connection details:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
```

**Supabase Studio** (the web UI at `localhost:54323`) lets you browse your tables, run SQL queries, and inspect data visually - very useful during development.

## What is PostGIS?

PostGIS is a **Postgres extension** that adds geographic/spatial capabilities. It lets Postgres understand *locations* (latitude/longitude points, areas, distances).

Without PostGIS, to find "dive spots within 10km," you'd need complex math in your application code. With PostGIS, it's a single database query:

```sql
-- Find all dive spots within 10km of a point
SELECT * FROM dive_spots
WHERE ST_DStance(
  location,
  ST_MakePoint(33.95, 27.45)::geography
) < 10000;  -- 10000 meters = 10km
```

### Key PostGIS Concepts

**1. Geography vs Geometry**

PostGIS has two spatial types:
- **geometry**: Flat 2D plane (like a paper map). Faster but less accurate for large distances.
- **geography**: Curved earth surface (like a globe). Slightly slower but accurate everywhere.

We use **geography** because we deal with real-world locations across the globe.

**2. SRID 4326 (WGS84)**

This is the coordinate system used by GPS. When we say "latitude 27.45, longitude 33.95," we're using SRID 4326. All our spatial data uses this system.

**3. Common PostGIS Functions**

| Function | What it does | Example use |
|----------|-------------|-------------|
| `ST_MakePoint(lng, lat)` | Creates a point from coordinates | Creating a dive spot location |
| `ST_DWithin(a, b, meters)` | Checks if two things are within a distance | "Is this spot within 1000m of another?" |
| `ST_Distance(a, b)` | Calculates distance between two things | "How far is this parking from the spot?" |
| `ST_X(point)` / `ST_Y(point)` | Extracts longitude / latitude from a point | Reading back coordinates |

**Important gotcha**: PostGIS uses `(longitude, latitude)` order, not `(latitude, longitude)`. This is a very common source of bugs!

```sql
-- CORRECT: longitude first, latitude second
ST_MakePoint(33.95, 27.45)  -- lng=33.95, lat=27.45

-- WRONG: latitude first
ST_MakePoint(27.45, 33.95)  -- This puts you in the wrong place!
```

## How It Fits in Our Project

```
Mobile App  -->  NestJS API  -->  Prisma ORM  -->  PostgreSQL + PostGIS
                                                        |
                                                   Supabase wraps this
                                                        |
                                                   Also provides:
                                                   - Auth (login/signup)
                                                   - Storage (photos)
```

### Prisma + PostGIS

Prisma doesn't natively understand PostGIS types. We handle this with:
1. **Raw SQL queries** for spatial operations (via `prisma.$queryRaw`)
2. **Regular Prisma** for everything else

```typescript
// Regular Prisma query (non-spatial)
const spot = await prisma.diveSpot.findUnique({
  where: { id: "abc-123" },
});

// Spatial query using raw SQL
const nearbySpots = await prisma.$queryRaw`
  SELECT id, name,
    ST_Distance(location, ST_MakePoint(${lng}, ${lat})::geography) as distance
  FROM dive_spots
  WHERE ST_DWithin(location, ST_MakePoint(${lng}, ${lat})::geography, ${radius})
  AND is_deleted = false
  ORDER BY distance
`;
```

## Database Migrations

Migrations are **version-controlled changes** to your database structure. Instead of manually modifying tables, you write migration files that describe the changes.

```bash
# Create a migration after changing schema.prisma
pnpm prisma migrate dev --name add-dive-spot-table

# This creates a file like:
# prisma/migrations/20240101120000_add_dive_spot_table/migration.sql

# Apply migrations (happens automatically with migrate dev)
pnpm prisma migrate deploy

# Reset everything (useful when things get messy in development)
pnpm prisma migrate reset
```

## Essential Commands Summary

```bash
# Supabase
supabase start              # Start local database
supabase stop               # Stop local database
supabase db reset           # Wipe and rebuild database
supabase status             # Show connection details

# Database access
psql postgresql://postgres:postgres@localhost:54322/postgres   # Direct SQL access

# Prisma (see prisma doc for more)
pnpm prisma migrate dev     # Create + apply migration
pnpm prisma studio          # Web UI for viewing data
```

## Common Gotchas

| Gotcha | Fix |
|--------|-----|
| `supabase start` fails | Make sure Docker Desktop is running |
| `connection refused` on port 54322 | Run `supabase start` first |
| PostGIS functions not found | Enable the extension: `CREATE EXTENSION IF NOT EXISTS postgis;` |
| Lat/lng swapped (wrong location) | Remember: PostGIS = `(longitude, latitude)` order |
| Migration conflicts | Run `supabase db reset` to start fresh (dev only!) |
| Data disappears after `supabase stop` | Local data persists between stop/start, but `db reset` wipes it |

## Learn More

- [Supabase Docs](https://supabase.com/docs) - Official docs
- [PostGIS Intro](https://postgis.net/workshops/postgis-intro/) - Free workshop
- [Supabase Local Dev](https://supabase.com/docs/guides/cli/local-development) - Setting up local environment
