# How Everything Connects

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR PHONE                              │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │          React Native + Expo (Mobile App)               │   │
│   │                                                         │   │
│   │  • Screens the user sees (maps, lists, dive logs)       │   │
│   │  • Written in TypeScript                                │   │
│   │  • Sends HTTP requests to the backend                   │   │
│   └───────────────────────┬─────────────────────────────────┘   │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │  HTTP requests
                            │  (GET /dive-spots, POST /reports, etc.)
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                     YOUR SERVER                                 │
│                           │                                     │
│   ┌───────────────────────▼─────────────────────────────────┐   │
│   │          NestJS + Fastify (Backend API)                 │   │
│   │                                                         │   │
│   │  • Receives requests from the mobile app                │   │
│   │  • Validates input (DTOs)                               │   │
│   │  • Runs business logic (services)                       │   │
│   │  • Runs on Node.js                                      │   │
│   │  • Written in TypeScript                                │   │
│   └───────────────────────┬─────────────────────────────────┘   │
│                           │                                     │
│                           │  TypeScript function calls           │
│                           │                                     │
│   ┌───────────────────────▼─────────────────────────────────┐   │
│   │          Prisma (ORM)                                   │   │
│   │                                                         │   │
│   │  • Translates TypeScript into SQL queries               │   │
│   │  • Manages database schema (migrations)                 │   │
│   │  • Provides type-safe database access                   │   │
│   └───────────────────────┬─────────────────────────────────┘   │
│                           │                                     │
│                           │  SQL queries                        │
│                           │                                     │
│   ┌───────────────────────▼─────────────────────────────────┐   │
│   │      PostgreSQL + PostGIS (Database via Supabase)       │   │
│   │                                                         │   │
│   │  • Stores all the data (dive spots, users, reports)     │   │
│   │  • PostGIS handles geospatial queries                   │   │
│   │  • Supabase also provides auth + file storage           │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   pnpm manages all the packages for both backend and mobile     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## A Real Request: "Show dive spots near me"

Here's what happens when you open the map in the app:

### Step 1: Mobile App (React Native)

```tsx
// The phone gets the user's GPS location
const location = await Location.getCurrentPositionAsync();

// Sends a request to the backend
const response = await fetch(
  `http://api.example.com/dive-spots/nearby?lat=${location.coords.latitude}&lng=${location.coords.longitude}&radius=10000`
);
const spots = await response.json();

// Renders pins on the map
spots.forEach(spot => addPinToMap(spot));
```

### Step 2: NestJS Controller (Receives the Request)

```typescript
// dive-spot.controller.ts
@Get("nearby")
async findNearby(
  @Query("lat") lat: number,       // Extracts lat from URL
  @Query("lng") lng: number,       // Extracts lng from URL
  @Query("radius") radius: number, // Extracts radius from URL
) {
  return this.diveSpotService.findNearby(lat, lng, radius);
}
```

### Step 3: NestJS Service (Business Logic)

```typescript
// dive-spot.service.ts
async findNearby(lat: number, lng: number, radius: number) {
  // Validate: radius can't be more than 50km
  if (radius > 50000) {
    throw new BadRequestException("Radius too large (max 50km)");
  }

  return this.diveSpotRepo.findNearby(lat, lng, radius);
}
```

### Step 4: Repository + Prisma (Database Query)

```typescript
// dive-spot.repository.ts
async findNearby(lat: number, lng: number, radius: number) {
  // Uses raw SQL because PostGIS needs it
  return this.prisma.$queryRaw`
    SELECT id, name, latitude, longitude,
      ST_Distance(
        location,
        ST_MakePoint(${lng}, ${lat})::geography
      ) as distance
    FROM dive_spots
    WHERE ST_DWithin(
      location,
      ST_MakePoint(${lng}, ${lat})::geography,
      ${radius}
    )
    AND is_deleted = false
    ORDER BY distance
  `;
}
```

### Step 5: PostgreSQL + PostGIS (Processes the Query)

The database:
1. Uses PostGIS to calculate distances on the Earth's surface
2. Filters spots within the radius
3. Sorts by distance
4. Returns the matching rows

### Step 6: Response Flows Back

```
PostgreSQL returns rows
  → Prisma converts to TypeScript objects
    → Service returns the objects
      → Controller sends as JSON HTTP response
        → Mobile app receives JSON
          → React Native renders pins on the map
```

## Development Workflow

When you're working on the app, you'll have multiple things running:

```bash
# Terminal 1: Start the database
supabase start

# Terminal 2: Start the backend
cd apps/backend
pnpm start:dev          # Runs on http://localhost:3000

# Terminal 3: Start the mobile app
cd apps/mobile
npx expo start          # Shows QR code, press 'i' for iOS sim
```

## Which File Do I Edit?

| I want to... | Edit this | Technology |
|---------------|-----------|------------|
| Change what a screen looks like | `apps/mobile/app/` or `components/` | React Native |
| Add a new API endpoint | `apps/backend/src/modules/<feature>/` | NestJS |
| Change business logic / rules | `<feature>.service.ts` | NestJS |
| Change a database query | `<feature>.repository.ts` | Prisma |
| Change the database structure | `prisma/schema.prisma` then migrate | Prisma |
| Add a new database table | `prisma/schema.prisma` then migrate | Prisma |
| Change how data is validated | `<feature>/dto/*.dto.ts` | NestJS + class-validator |
| Add authentication to a route | `<feature>.controller.ts` (add guard) | NestJS |
| Add a new package | `pnpm add <pkg>` or `npx expo install <pkg>` | pnpm |

## Data Flow Summary

```
User taps button
  → React Native sends HTTP request
    → NestJS receives and validates
      → Service runs business logic
        → Repository queries via Prisma
          → PostgreSQL + PostGIS processes
        → Result comes back
      → Service formats response
    → NestJS sends HTTP response
  → React Native updates the screen
User sees the result
```

Every piece has a clear job. No piece does another piece's job. That's the architecture.
