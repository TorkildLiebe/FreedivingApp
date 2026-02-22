# DiveFreely – Architecture (MVP)

**Status:** Draft for MVP
**Focus:** Simple, feature-based backend and mobile architecture
**Principle:** Keep dependencies replaceable (DB, Auth, Storage) without touching domain logic

---

## 1) Goals & Non-Goals

### Goals
- Deliver a **mobile-first backend** with solid domain rules (Spots, Reports, Users, Photos).
- Keep **layers** simple and swappable: DB, Auth, and Storage can be replaced via adapters (decoupled infrastructure).
- Fast DX for **one developer**: pnpm, scripts, seeds, local Supabase, strong typing.
- Produce **clear APIs** (OpenAPI), predictable errors, and light e2e tests.

### Non-Goals (MVP)
- No microservices. Start **single service** (modular monolith).
- No production deployment before MVP completion.
- No heavy realtime; reports are **planned/logged**, not live tracking.
- Social features, discovery feed, and advanced media pipeline are out of scope.

---

## 2) Technologies

- **Language:** TypeScript
- **Package manager:** pnpm
- **Runtime:** Node.js
- **Framework:** NestJS (Fastify)
- **Database:** Supabase Postgres (local via `supabase start`) with **PostGIS**
- **ORM:** Prisma
- **Mobile:** React Native with Expo
- **Auth:** Supabase Auth (JWT/OIDC) + backend JWT verification (jose/JWKS)
- **Object storage:** Supabase Storage (pre-signed uploads)
- **Maps (client):** MapLibre GL with Kartverket WMTS tiles
- **Docs:** Swagger/OpenAPI
- **Testing:** Jest (unit + light e2e with Supertest)

---

## 3) Vertical Slice Architecture

Features organized by module (Spots, Reports, Users, Photos), not by layer. Each module self-contained.

**Each module includes:**
- **Controllers:** HTTP routes with auth guards
- **DTOs:** Request validation, enforce DOMAIN.md invariants
- **Services:** Use-case logic, orchestrate domain rules
- **Domain:** Entity types, validation (no external deps)
- **Repositories:** Prisma queries, injected via interfaces

Domain logic independent of NestJS/Prisma. Clear separation enables module evolution without cross-module impact.

---

## 4) Replaceable Components (Swappability)

DB/Auth/Storage replaceable via interfaces. No direct infrastructure imports in domain/use-case code.

**Examples:** Supabase Postgres -> any Postgres | Supabase Auth -> OIDC JWT provider | Supabase Storage -> S3-compatible service

---

## 5) Backend Module & Folder Structure

```
apps/backend/
  src/
    modules/
      health/
        health.controller.ts
        health.module.ts
      spots/
        spots.controller.ts        # GET /spots (bbox), GET /spots/:id
        spots.service.ts
        spots.repository.ts
        spots.module.ts
        dto/
          list-spots-by-bbox-query.dto.ts
          list-spots-response.dto.ts
          spot-detail-response.dto.ts
          spot-summary-response.dto.ts
          parking-location-response.dto.ts
      users/
        users.controller.ts        # GET /users/me
        users.service.ts
        users.repository.ts
        users.module.ts
        dto/
          get-me-response.dto.ts
      ratings/
        ratings.controller.ts      # PUT /spots/:spotId/rating
        ratings.service.ts
        ratings.repository.ts
        ratings.module.ts
        dto/
          upsert-rating.dto.ts
          spot-rating-response.dto.ts
    common/
      auth/                        # AuthGuard, JWT verifier, CurrentUser decorator
      errors/                      # DomainError, InvalidBBoxError, SpotNotFoundError
      filters/                     # DomainExceptionFilter
    prisma/
      prisma.service.ts
      prisma.module.ts
    main.ts
    app.module.ts
  prisma/
    schema.prisma                  # Models: User, DiveSpot, ParkingLocation
    migrations/
    seed.ts
```

> **Not yet implemented:** reports/, photos/, uploads/, ratings/ modules (see USECASE.md for specs).

---

## 6) AuthN & AuthZ

- **Authentication (AuthN):**
  - Frontend gets a **Supabase access token**.
  - Backend verifies JWT via **JWKS** (`jose`) using `AUTH_JWKS_URL`, `AUTH_ISSUER`.
  - On first verified call: **getOrCreate User** (`sub` from JWT -> `User.externalId` in DB).

- **Authorization (AuthZ):**
  - Roles: `user`, `moderator`, `admin`.
  - **Guard pattern:** `@UseGuards(AuthGuard, RolesGuard)` on controllers.
  - Write ops (spots/reports/photos): only **owner**, **moderator**, or **admin** of the resource.
  - Favorites (personal list) are only accessible to the owning user.

- **Dev/CI Bypass:**
  - `AUTH_DEV_BYPASS=true` (and `NODE_ENV` in {development,test}) -> accept `x-dev-user-id` / `x-dev-role` headers for local testing.

---

## 7) Local Dev & Tooling (MVP)

- **Supabase local:**
  - Start with: `supabase start`
  - Services: Postgres (`54322`), Auth (`54321`), Storage (`54323`)
- **Migrations:** `supabase db reset` or `pnpm prisma:migrate`
- **Environment (.env):** see `.env.example`

---

## 8) API Design

- **Unversioned for MVP** (we will add `/v1` prefix when making it public).
- **OpenAPI** documentation is auto-generated; DTOs reflect `DOMAIN.md` invariants.
- Minimal payloads for map endpoints (e.g. BBOX listing returns only id/title/center).

---

## 9) Mobile Architecture (Expo Router + Feature Modules)

### 9.1 Mobile Principles
- Use **Expo Router** for navigation and route composition only.
- Keep route files in `app/` thin: compose screens, no heavy data logic.
- Organize mobile code by **feature** under `src/features/*`.
- Keep reusable/shared code in `src/shared/*`.
- Platform details are adapter-like: `.ios.tsx` / `.android.tsx` at feature/shared boundaries when iOS/Android differences exist.

### 9.2 Mobile Folder Structure

```
apps/mobile/
  app/                               # Expo Router routes only
    _layout.tsx
    (auth)/
      _layout.tsx
      login.tsx
    (app)/
      _layout.tsx
      (tabs)/
        _layout.tsx
        index.tsx                    # -> MapScreen
        profile.tsx                  # -> ProfileScreen
    +not-found.tsx

  src/
    features/
      auth/
        context/auth-context.tsx
        screens/login-screen.tsx
        screens/profile-screen.tsx
      map/
        screens/map-screen.tsx
        components/map-view.tsx      # Native MapView (iOS + Android)
        components/map-view-types.ts
        components/map-floating-button.tsx
        hooks/use-location.ts
        hooks/use-spots.ts
        constants/map.ts
        types.ts
      spots/                         # Spot detail, creation, favorites
        components/
        hooks/
        types.ts
      reports/                       # Dive logging (AddDiveForm)
        components/
        hooks/
        types.ts
      ratings/                       # SpotRating (RatingSheet)
        components/
        hooks/
        types.ts

    shared/
      theme/
        colors.ts                    # Design tokens (emerald/teal/stone)
        typography.ts                # Font families (Space Grotesk/Inter/IBM Plex Mono)
        index.ts

    infrastructure/
      api/client.ts                  # authenticated fetch wrapper
      supabase/client.ts             # Supabase client setup
```

### 9.3 Dependency Rules (Mobile)
- `app/*` can import from `src/features/*`, `src/shared/*`, `src/infrastructure/*`.
- `src/features/*` can import from `src/shared/*` and `src/infrastructure/*`.
- `src/shared/*` must not import from `src/features/*`.
- `src/infrastructure/*` must not import from `app/*` or feature screen components.
- Avoid cross-feature imports except through explicit shared contracts (types/utilities).

---

*Last updated: February 2026*
