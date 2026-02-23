---
paths:
  - "apps/backend/**"
---
# Backend Rules

## Module Structure

- Follow vertical slices: `controller -> dto -> service -> repository`.
- Keep each feature self-contained under `apps/backend/src/modules/<feature>/`.
- Expected modules: `health/`, `spots/`, `users/`, `reports/`, `photos/`, `uploads/`, `ratings/`.
- Keep domain logic independent of NestJS/Prisma and infrastructure adapters.
- Prefer extending existing module patterns over introducing new layers.

## API and Services

- DTOs must enforce input constraints with `class-validator`.
- Services own use-case orchestration and domain checks.
- Repositories own persistence details and query shape.
- Throw domain errors and map them via shared filters; avoid ad-hoc HTTP errors in domain logic.

## Data Access

- Use Prisma `$transaction` for multi-step writes that must be atomic.
- Respect soft-delete semantics where applicable (`isDeleted = false` in reads).
- Keep query payloads minimal for map/list endpoints.

## Verification Expectations

For backend behavior changes, run verification that matches touched layer:
- Service or domain logic changes:
  - Add or update unit tests for invariants, branching, and domain error mapping.
- Repository or query changes:
  - Add or update integration-style validation for query path and persistence behavior.
- Controller or DTO changes:
  - Verify request validation and auth/permission paths, including negative cases.

Use risk escalation rules from `.claude/rules/testing.md` for final check scope.

## Architecture Guardrails

- No cross-cutting business logic in controllers.
- No domain imports from framework-specific infrastructure.
- Reuse `apps/backend/src/common/*` for auth/errors/filters patterns.
