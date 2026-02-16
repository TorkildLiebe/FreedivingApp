# DiveFreely-Alpha

A mobile dive spot and report platform for Norway, with collaborative dive data sharing.

## Project Structure

```
DiveFreely-Alpha/
├── apps/
│   ├── backend/          # NestJS API with Prisma & Supabase
│   └── mobile/           # React Native mobile app (Expo)
├── packages/
│   └── shared/           # Shared types, DTOs, and utilities
├── docs/                 # Architecture & domain documentation
├── supabase/            # Local Supabase configuration
└── package.json         # Monorepo scripts
```

## Tech Stack

### Backend
- **Framework**: NestJS (Fastify)
- **Database**: Supabase Postgres with PostGIS
- **ORM**: Prisma
- **Auth**: Supabase Auth (JWT/OIDC)
- **Storage**: Supabase Storage

### Mobile
- **Framework**: Expo with React Native (development builds)
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State**: TanStack Query + Zustand
- **Maps**: MapLibre GL Native (Kartverket WMTS tiles)

## Quick Start

### Prerequisites
- Node.js >= 22.0.0 (use `nvm use` to auto-switch)
- pnpm >= 10.0.0
- Docker (for Supabase local)
- Supabase CLI

### Initial Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start Supabase locally**:
   ```bash
   pnpm dev:infra
   ```

3. **Set up backend**:
   ```bash
   cd apps/backend
   cp .env.example .env
   pnpm prisma:generate
   pnpm prisma:migrate
   ```

4. **Set up mobile**:
   ```bash
   cd apps/mobile
   cp .env.example .env
   # Update .env with Supabase anon key from step 2
   ```

5. **Run development servers**:
   ```bash
   # Terminal 1: Backend
   pnpm dev:backend

   # Terminal 2: Mobile
   pnpm dev:mobile
   ```

## Available Commands

### Infrastructure
```bash
pnpm dev:infra       # Start Supabase (Postgres, Auth, Storage)
pnpm dev:stop        # Stop Supabase
```

### Backend
```bash
pnpm dev:backend     # Start NestJS in watch mode
pnpm build:backend   # Build backend for production
pnpm lint:backend    # Lint backend code
pnpm prisma:generate # Generate Prisma Client
pnpm prisma:migrate  # Run database migrations
```

### Mobile
```bash
pnpm dev:mobile      # Start Metro bundler
pnpm ios             # Build and run on iOS simulator (development build)
pnpm android         # Build and run on Android emulator (development build)
pnpm lint:mobile     # Lint mobile code
pnpm type-check      # TypeScript type checking
```

**Note:** The mobile app uses native modules (MapLibre) and requires development builds. Expo Go is not supported.

## Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and technical decisions
- **[DOMAIN.md](docs/DOMAIN.md)** - Domain entities and business rules
- **[USECASE.md](docs/USECASE.md)** - Feature specifications and use cases
- **[NONFUNCTIONAL.md](docs/NONFUNCTIONAL.md)** - Security, reliability, and quality requirements
- **[VISION.md](docs/VISION.md)** - Project goals and principles
- **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Development guidelines

## Mobile App

See [apps/mobile/README.md](apps/mobile/README.md) for detailed mobile development documentation.

## Local Development URLs

After running `pnpm dev:infra`:
- **Supabase Studio**: http://127.0.0.1:54323
- **Supabase API**: http://127.0.0.1:54321
- **Postgres**: postgresql://postgres:postgres@localhost:54322/postgres

After running `pnpm dev:backend`:
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api (Swagger/OpenAPI)

## Architecture Principles

- **Vertical slices**: Feature-based modules (spots, reports, users)
- **Separation of concerns**: Clear layers (API, domain, infrastructure)
- **Type safety**: Full TypeScript coverage
- **Replaceable components**: Database, auth, and storage are swappable

## License

Private - All Rights Reserved
