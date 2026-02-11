## Project Overview
This is a freediving app using Expo (React Native + Web), NestJS with Fastify, TypeScript throughout, and pnpm as the package manager. Always ensure changes work on BOTH native and web platforms.

## Documentation Context
- **Features/use cases** -> `USECASE.md` (operational flows)
- **Validation/business rules** -> `DOMAIN.md` (entities, invariants, errors)
- **Module structure** -> `ARCHITECTURE.md` (vertical slices, folder layout)
- **Quality/security/ops** -> `QUALITY.md` (testing, security, logging, GDPR)
- **Workflow** -> `CONTRIBUTING.md` (branch/commit conventions)
- **Product scope** -> `VISION.md` (MVP boundaries)
- **Feature tracking** -> GitHub Project Board (implemented vs. planned)

## Architecture Patterns
- **Vertical slices** (ARCHITECTURE.md §3): features self-contained in `/apps/backend/src/modules/<feature>/`
- Each module: controllers, DTOs, services, domain, repositories
- **Ports/adapters** (§4): no direct infrastructure imports in domain/use-case code

## Error Handling
- Domain errors → HTTP: 400 (Invalid*), 401 (auth), 403 (Forbidden), 404 (*NotFound*), 409 (Conflict)
- Use exception filters; never expose stack traces
- Domain errors in `/common/errors/`; throw from services

## Data Patterns
- **Soft deletes:** Always filter `isDeleted=false` in queries
- **Transactions:** Use Prisma `$transaction` for multi-step writes
- **DTOs:** class-validator decorators; ValidationPipe with `whitelist: true`
- **Repositories:** One per entity in module; inject PrismaService

## Backend (NestJS)
When adding NestJS modules or features, always check: 1) Required packages are installed (e.g., @fastify/cors), 2) Module dependencies are imported (e.g., UsersModule in any module using UsersService), 3) Auth guards handle both dev bypass AND real JWT tokens.

## Testing
Jest is configured with pnpm workspaces. Known issues: pnpm transform patterns need special handling, and Jest 30 sandboxing can conflict with Expo. If tests fail on transforms or sandboxing, check jest.config.ts transformIgnorePatterns and sandbox settings first.

## File Naming
- Files: kebab-case (`dive-spot.service.ts`)
- Classes: PascalCase (`DiveSpotService`)
- DTOs: `CreateSpotDto`, `UpdateSpotDto`

## Critical Constraints
- Spot proximity: 1000m min between centers
- Parking: max 5, within 5000m of spot, dedupe <2m
- Photos: max 5 per spot/report
- Report edits: 48h window (owner) or mod/admin bypass
- Text: no emoji in displayName, title, caption

## Conventions
- **Conciseness:** Extremely concise; sacrifice grammar for brevity
- **Communication:** Bullet/numbered lists, short sentences
- **GitHub:** Use `gh` CLI for issues, PRs, etc. Don't commit or create a PR without my permission.
- **Commits:** Conventional commits (`feat#123: description`) in imperative tense
- **Linting:** Lint and lint:fix before each commit
- **Tests:** Remind to write/update tests (target 80% coverage)
- **Focus:** Relevant context only; avoid digressions  

### Planning
- List unresolved questions at end (keep brief)
- Make the plan multi-phased, each phase must include:
    - TODO list
    - Acceptance criterias
    - Tests to create
    - run tests, linting and spellcheking at the end of each test

## Pre-completion Checklist
Always run `pnpm test`, `pnpm lint`, and `pnpm tsc --noEmit` before considering a task complete. Verify the app works on web (`pnpm expo start --web`) in addition to native.

## Response Formatting

### Prompt Separators
At the end of every response (when waiting for user input), add a visual separator using repeated emojis:

**Separator types by response category:**
- **✅ Success/Completion**: `✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅`
- **📋 Planning/Research**: `📋📋📋📋📋📋📋📋📋📋📋📋📋📋📋`
- **⚠️ Questions/Clarification**: `⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️`
- **🔧 Technical/Implementation**: `🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧`
- **❌ Error/Issue**: `❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌`
