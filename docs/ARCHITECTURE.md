# DiveFreely – Architecture (MVP)

**Status:** Draft for MVP  
**Focus:** Simple, feature-based backend first; mobile later  
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
- **Auth:** Supabase Auth (JWT/OIDC) + backend JWT verification (jose/JWKS)  
- **Object storage:** Supabase Storage (pre‑signed uploads)  
- **Maps (client):** Norgeskart WMTS (later; outside MVP backend scope)  
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

**Examples:** Supabase Postgres → any Postgres | Supabase Auth → OIDC JWT provider | Supabase Storage → S3-compatible service

---

## 5) Module & Folder Structure

```
apps/backend/
  src/
    modules/
      spots/
        spots.controller.ts
        spots.service.ts          # Use-case logic
        spots.repository.ts       # Prisma queries
        dto/
      reports/
        reports.controller.ts
        reports.service.ts
        reports.repository.ts
        dto/
      users/
        users.controller.ts
        users.service.ts
        dto/
      photos/
        photos.controller.ts
        photos.service.ts
        photos.repository.ts
        dto/
      uploads/
        uploads.controller.ts
    common/
      auth/                       # Guards, JWT verifier
      errors/                     # Domain exceptions
      utils/                      # Geo calculations
    main.ts
    app.module.ts
  prisma/
    schema.prisma
    migrations/
    seed.ts
```

---

## 6) AuthN & AuthZ

- **Authentication (AuthN):**
  - Frontend gets a **Supabase access token**.
  - Backend verifies JWT via **JWKS** (`jose`) using `AUTH_JWKS_URL`, `AUTH_ISSUER`.
  - On first verified call: **getOrCreate User** (`sub` from JWT → `User.externalId` in DB).

- **Authorization (AuthZ):**
  - Roles: `user`, `moderator`, `admin`.
  - **Guard pattern:** `@UseGuards(AuthGuard, RolesGuard)` on controllers.
  - Write ops (spots/reports/photos): only **owner**, **moderator**, or **admin** of the resource.
  - Favorites (personal list) are only accessible to the owning user.

- **Dev/CI Bypass:**
  - `AUTH_DEV_BYPASS=true` (and `NODE_ENV` in {development,test}) → accept `x-dev-user-id` / `x-dev-role` headers for local testing.

---

## 7) Local Dev & Tooling (MVP)

- **Supabase local:**
  - Start with: `supabase start`
  - Services: Postgres (`54322`), Auth (`54321`), Storage (`54323`)
- **Migrations:** `supabase db reset` or `pnpm prisma:migrate`
- **Environment (.env):** see `NONFUNCTIONAL.md` and `.env.example`

---

## 8) API Design

- **Unversioned for MVP** (we will add `/v1` prefix when making it public).
- **OpenAPI** documentation is auto‑generated; DTOs reflect `DOMAIN.md` invariants.
- Minimal payloads for map endpoints (e.g. BBOX listing returns only id/title/center).

---

*Last updated: October 2025*