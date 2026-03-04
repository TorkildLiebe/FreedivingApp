# DiveFreely – Architecture (MVP)

**Status:** Current implementation snapshot for MVP  
**Principle:** Keep feature modules simple while preserving replaceable infrastructure boundaries.

---

## 1) Goals & Non-Goals

### Goals
- Mobile-first backend with clear domain rules for spots, dive logs, users, uploads, and ratings.
- Feature-oriented modules in backend and mobile.
- Swappable infrastructure for DB, auth, and storage.
- Fast iteration for a solo developer with strong typing and focused tests.

### Non-Goals (Current MVP)
- No microservices.
- No standalone admin dashboard yet.
- No realtime tracking.
- No social feed or chat.

---

## 2) Technologies

- **Language:** TypeScript
- **Package manager:** pnpm
- **Backend:** NestJS (Fastify)
- **Database:** Supabase Postgres + PostGIS
- **ORM:** Prisma
- **Mobile:** Expo React Native
- **Auth:** Supabase Auth with backend JWT verification
- **Object storage:** Supabase Storage using feature-specific pre-signed upload URLs
- **Maps:** MapLibre on mobile with Norwegian map tile sources
- **Testing:** Jest (unit/integration style)

---

## 3) Backend Architecture

The backend is a modular monolith. Each feature module owns its controller, service, repository, and DTOs.

### Current backend modules

```
apps/backend/
  src/
    modules/
      health/
        health.controller.ts
        health.module.ts
      spots/
        spots.controller.ts
        spots.service.ts
        spots.repository.ts
        spot-photo-storage.service.ts
        dto/
      dive-logs/
        dive-logs.controller.ts
        dive-logs.service.ts
        dive-logs.repository.ts
        dive-log-photo-storage.service.ts
        dto/
      users/
        users.controller.ts
        users.service.ts
        users.repository.ts
        user-avatar-storage.service.ts
        dto/
    common/
      auth/
      errors/
      filters/
      validation/
```

### Important implementation notes

- Spot ratings are implemented inside the `spots` module, not a separate `ratings` module.
- Photo upload URL generation is handled inside feature modules:
  - spot photos in `spots`
  - dive-log photos in `dive-logs`
  - avatars in `users`
- There is no standalone `photos/` or `uploads/` module.
- Domain-style validation lives in DTOs and services; shared validators live under `common/validation/`.

---

## 4) AuthN & AuthZ

- Mobile obtains a Supabase access token.
- Backend verifies JWTs and maps the token to an application user.
- Roles are `user`, `moderator`, and `admin`.
- Write operations are restricted by ownership or privileged role where applicable.
- Dive-log updates allow moderator/admin bypass for the normal 48-hour owner edit window.
- Dev bypass supports explicit headers in development/test when enabled.

---

## 5) API Design

- Unversioned REST API for MVP.
- Controllers enforce DTO validation at the transport boundary.
- `GET /spots/:id` returns full spot detail including an initial embedded dive-log slice.
- `GET /spots/:id/dive-logs` handles paginated dive-log retrieval.
- `GET /users/me/activity` aggregates reports, created spots, and favorites into one payload.

---

## 6) Mobile Architecture

Expo Router is used only for route composition. Feature code lives under `src/features`.

### Current mobile structure

```
apps/mobile/
  app/
    (auth)/
      login.tsx
    (app)/
      (tabs)/
        index.tsx
        profile.tsx
  src/
    features/
      auth/
        context/
        hooks/
        screens/
        types/
      map/
        components/
        constants/
        hooks/
        screens/
        types.ts
        utils/
    infrastructure/
      api/
      supabase/
    shared/
      components/
      theme/
```

### Important implementation notes

- `auth` owns authentication and profile orchestration.
- `map` currently contains map, spot detail, spot creation, favorites, dive-log, and spot-rating UI flows.
- Separate `spots`, `reports`, and `ratings` feature folders are planned abstractions, but they are not split out yet.

---

## 7) Current Gaps Kept Out of Scope

- Password change flow
- Legal screen flow
- Public profile endpoint
- Standalone photo attachment model with captions
- Duplicate recent report protection

These remain product/documentation items until explicitly implemented.

*Last updated: March 2026*
