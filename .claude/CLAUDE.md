# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DiveFreely is a mobile dive spot and report platform for Norway. It's a **pnpm monorepo** with three workspaces:
- `apps/backend` — NestJS API (Fastify adapter) with Prisma ORM and Supabase Postgres+PostGIS
- `apps/mobile` — React Native app via Expo (Expo Router for navigation)
- `packages/shared` — Shared types/constants (published as `@freediving/shared`)
- Important: Expo is native-only (iOS and Android). Web platform is NOT supported.
- Development: Uses Expo development builds (not Expo Go). Run `pnpm ios` or `pnpm android` to build and launch.

## Commands
- See @package.json for available pnpm commands


## Architecture

### Backend — Vertical Slice Modules (`apps/backend/src/modules/`)

Each feature is a self-contained NestJS module with: controller → service → repository → DTOs. Current modules: `health`, `spots`, `users`. Domain logic is kept independent of NestJS/Prisma.

Key infrastructure in `apps/backend/src/common/`:
- `auth/` — AuthGuard (JWT verification via jose/JWKS), `@CurrentUser()` decorator, dev bypass mode (`AUTH_DEV_BYPASS=true` + `x-dev-user-id`/`x-dev-role` headers)
- `errors/` — Domain error hierarchy (`DomainError` base, `SpotNotFoundError`, `InvalidBBoxError`)
- `filters/` — `DomainExceptionFilter` maps domain errors to HTTP responses

Auth flow: Supabase issues JWT → backend verifies via JWKS → `getOrCreate` User on first call (maps JWT `sub` to `User.externalId`).

### Mobile — Feature-Based (`apps/mobile/src/features/`)

Route files in `app/` are thin wrappers — real logic lives in `src/features/`. Current features: `auth` (login, profile screens, auth context), `map` (map screen, MapLibre components, spot hooks).

**Dependency rules:** `app/` → `features/` → `shared/` / `infrastructure/`. No cross-feature imports. Platform-specific code uses `.ios.tsx` / `.android.tsx` suffixes when needed (iOS vs Android differences).

Maps use **MapLibre GL** with Kartverket WMTS tiles (Norwegian mapping service).

### Database

Prisma schema at `apps/backend/prisma/schema.prisma`. Models: `User`, `DiveSpot` (with PostGIS spatial queries via bbox), `ParkingLocation`. Tables use snake_case mapping (`@@map`).

## Commit Convention

Commits must follow: `type#issue: description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`
- Example: `feat#42: add dive spot detail sheet`
- Enforced by Husky commit-msg hook

Direct commits to `main` are blocked by the pre-commit hook. Use feature branches: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`.

## Git Hooks (Husky)

- **pre-commit**: Blocks main branch commits, runs lint + type-check for both apps
- **pre-push**: Runs lint + tests for both apps
- **commit-msg**: Validates `type#issue: description` format



## **Project Overview**

DiveFreely is a freediving app for Norway.

**Stack**

- Monorepo (pnpm workspaces)
- apps/backend — NestJS (Fastify), Prisma, Supabase Postgres + PostGIS
- apps/mobile — Expo (React Native, Expo Router)
- packages/shared — shared types/constants (@freediving/shared)
- TypeScript everywhere

**Hard requirement:** All changes must work on **iOS and Android**.

---
$ Use @ to refrence the files, they lie under /docs
## **Source of Truth**

- Use cases / flows → USECASE.md
- Domain rules / invariants → DOMAIN.md
- Architecture patterns → ARCHITECTURE.md
- Quality / security / ops → QUALITY.md
- Workflow / branching → CONTRIBUTING.md
- Product scope (MVP limits) → VISION.md
- Feature status → GitHub Project Board (FreedivingApp Project)

If unsure: check these files before inventing patterns.

---

## **Architecture**

### **Backend (Vertical Slices)**

Location: apps/backend/src/modules/<feature>/

Each feature:

- controller
- DTOs
- service (use-case logic)
- repository
- domain (no framework deps)

Rules:

- Domain logic independent of NestJS/Prisma
- No infrastructure imports in domain
- One repository per entity
- Use Prisma $transaction for multi-step writes
- Throw domain errors only (mapped via exception filters)

Auth:

- Supabase JWT → backend verifies via JWKS
- getOrCreate user on first call
- Dev bypass supported (AUTH_DEV_BYPASS=true)

---

### **Mobile (Feature-Based)**

- Routes in app/ are thin
- Real logic in src/features/<feature>/
- No cross-feature imports
- Platform-specific: .ios.tsx / .android.tsx for platform differences
- Maps: MapLibre GL + Kartverket WMTS

Dependency direction:

app/ → features/ → shared/ / infrastructure/

---

## **Critical Domain Constraints**

Enforce strictly:

- Spot proximity ≥ 1000m between centers
- Parking:
    - max 5
    - within 5000m of spot
    - dedupe < 2m
- Photos: max 5 per spot/report
- Report edits: 48h (owner), mod/admin bypass
- No emoji in displayName, title, caption

---

## **Conventions**

### **Commits**

Format:

type#issue: description

Types:

feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert

- Imperative tense
- No direct commits to main
- Use feature branches: feat/<scope>, fix/<scope>, etc.
- Enforced by Husky

### **Before Completing Work**

Always run:

```
pnpm test
pnpm lint
pnpm tsc --noEmit
```

Also verify:

```
pnpm ios
pnpm android
```

App must function on both iOS and Android.

---

## **Testing**

- Jest with pnpm workspaces
- Target ≥ 80% coverage
- Update/add tests for all behavior changes
- If Jest fails due to transforms/sandboxing, inspect jest.config.ts first

---

## **Development Rules for Claude**

- Be concise
- Follow existing patterns; do not introduce new architecture
- Respect vertical slice boundaries
- Do not commit or create PR without explicit permission
- Remind about tests when adding logic
- List unresolved questions briefly at the end when planning

When uncertain: read the relevant .md file before implementing.
