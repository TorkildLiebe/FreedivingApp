# Monorepo Best Practices

## 1. Understanding Our Monorepo

```
FreedivingApp/                  # Root
├── apps/
│   ├── backend/               # NestJS API (independent app)
│   └── mobile/                # Expo React Native (independent app)
├── packages/
│   └── shared/                # Shared types, constants, utilities
├── pnpm-workspace.yaml        # Defines workspace structure
├── package.json               # Root scripts and shared devDeps
└── node_modules/              # All dependencies (hoisted by pnpm)
```

### Why monorepo?
- **Shared code**: Types, constants, and utilities used by both apps
- **Atomic changes**: Update the API and mobile client in one PR
- **Consistent tooling**: Same linting, formatting, and testing config
- **Single source of truth**: One repo, one CI pipeline

### Why pnpm?
- **Strict**: Each package only sees its declared dependencies (no phantom deps)
- **Fast**: Content-addressable store, hard links instead of copies
- **Disk efficient**: Shared dependencies stored once
- **Workspace protocol**: `workspace:*` for local package references

## 2. Workspace Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'       # Each folder in apps/ is a workspace
  - 'packages/*'   # Each folder in packages/ is a workspace
```

### Root package.json scripts

```json
{
  "scripts": {
    "dev:backend": "pnpm --filter backend run start:dev",
    "dev:mobile": "pnpm --filter mobile run start",
    "dev:infra": "supabase start",
    "test:backend": "pnpm --filter backend run test",
    "lint": "pnpm --filter backend run lint && pnpm --filter mobile run lint",
    "lint:fix": "pnpm --filter backend run lint:fix",
    "prisma:generate": "pnpm --filter backend exec prisma generate",
    "prisma:migrate": "pnpm --filter backend exec prisma migrate dev"
  }
}
```

### The `--filter` flag

```bash
# Run command in specific workspace
pnpm --filter backend run test
pnpm --filter mobile run start
pnpm --filter @freediving/shared run build

# Run command in all workspaces
pnpm -r run build

# Run command in all workspaces that have the script
pnpm -r --if-present run lint
```

## 3. Shared Package

### What belongs in shared?

```typescript
// packages/shared/src/index.ts

// Constants used by both apps
export const APP_NAME = 'DiveFreely';

// Types/interfaces shared between frontend and backend
export interface DiveSpotResponse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string | null;
}

// Enums used in DTOs and UI
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

// Validation constants (used in both DTO validation and form validation)
export const VALIDATION = {
  SPOT_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 2000,
  MAX_PHOTOS_PER_SPOT: 5,
  MAX_PARKING_PER_SPOT: 5,
  MIN_SPOT_DISTANCE_METERS: 1000,
  MAX_PARKING_DISTANCE_METERS: 5000,
} as const;
```

### What does NOT belong in shared
- Backend-only code (Prisma models, NestJS decorators, services)
- Mobile-only code (React components, React Native APIs)
- Environment-specific code
- Large dependencies

### Using the shared package

```typescript
// In backend
import { VALIDATION, UserRole } from '@freediving/shared';

// In mobile
import { DiveSpotResponse, APP_NAME } from '@freediving/shared';
```

### Building the shared package

```bash
# Shared package must be built before apps can use it
pnpm --filter @freediving/shared run build

# Or in watch mode during development
pnpm --filter @freediving/shared run dev
```

## 4. Dependency Management

### Where to install dependencies

| Scenario | Where | Command |
|----------|-------|---------|
| Backend-only package | `apps/backend` | `pnpm --filter backend add package-name` |
| Mobile-only package | `apps/mobile` | `pnpm --filter mobile add package-name` |
| Shared by both apps | `packages/shared` | `pnpm --filter @freediving/shared add package-name` |
| Root dev tool (used in scripts) | Root | `pnpm add -D -w package-name` |

### Never install app-specific deps at root

```bash
# BAD - installs @nestjs/common at root level
pnpm add @nestjs/common

# GOOD - installs in the backend workspace
pnpm --filter backend add @nestjs/common
```

### Version consistency

When multiple workspaces use the same dependency, keep versions aligned:

```bash
# Check for version mismatches
pnpm ls typescript -r  # Lists all typescript versions across workspaces
```

### Updating dependencies

```bash
# Update all dependencies in a workspace
pnpm --filter backend update

# Update a specific package
pnpm --filter backend update prisma

# Interactive update (shows which packages have updates)
pnpm --filter backend update --interactive

# Security audit
pnpm audit
```

## 5. TypeScript Configuration

### Configuration hierarchy

```
tsconfig.json (root)          # Base config: target, strict mode
├── apps/backend/tsconfig.json   # Extends root, adds NestJS-specific
├── apps/mobile/tsconfig.json    # Extends expo/tsconfig.base
└── packages/shared/tsconfig.json # Extends root, outputs to dist/
```

### Path mapping for shared package

```json
// apps/backend/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@freediving/shared": ["../../packages/shared/src"]
    }
  }
}
```

## 6. Common Patterns

### Running development servers

```bash
# Terminal 1: Infrastructure
pnpm dev:infra      # Starts Supabase (Postgres, Auth)

# Terminal 2: Backend
pnpm dev:backend    # NestJS with hot-reload

# Terminal 3: Mobile
pnpm dev:mobile     # Expo dev server

# Terminal 4: Shared (if modifying shared types)
pnpm --filter @freediving/shared run dev  # TypeScript watch mode
```

### Adding a new workspace

```bash
# 1. Create the directory
mkdir -p packages/new-package

# 2. Initialize package.json
cd packages/new-package
pnpm init

# 3. Set the name in package.json
# "name": "@freediving/new-package"

# 4. Add to workspaces (if not already covered by glob)
# pnpm-workspace.yaml already has 'packages/*'

# 5. Install dependencies
pnpm install
```

### Cross-workspace references

```json
// apps/backend/package.json
{
  "dependencies": {
    "@freediving/shared": "workspace:*"  // Always use latest local version
  }
}
```

## 7. CI/CD Considerations

### Only run what changed

```bash
# pnpm can detect which workspaces changed
pnpm --filter "...[origin/main]" run test  # Test only changed packages

# Or use specific filters
pnpm --filter backend run test   # If only backend changed
pnpm --filter mobile run lint    # If only mobile changed
```

### Build order matters

```bash
# Shared must build before apps that depend on it
pnpm --filter @freediving/shared run build
pnpm --filter backend run build
pnpm --filter mobile run build

# Or let pnpm figure out the order
pnpm -r run build  # Builds in dependency order
```

## 8. Common Mistakes

| Mistake | Fix |
|---------|-----|
| Installing deps at wrong level | Use `--filter` to target correct workspace |
| Importing from `../../../packages/shared` | Use `@freediving/shared` package name |
| Forgetting to build shared after changes | Run shared in watch mode during dev |
| Circular workspace dependencies | Shared should never import from apps |
| Different TypeScript versions | Align versions across workspaces |
| Running commands without `--filter` | Always specify which workspace |

## Learn More

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [pnpm Filtering](https://pnpm.io/filtering)
- [Monorepo Tools Comparison](https://monorepo.tools/)
