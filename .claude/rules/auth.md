---
paths:
  - "apps/backend/src/common/auth/**"
  - "apps/backend/src/modules/**"
---
# Auth Rules

## Authentication Flow

- Expected flow: Supabase JWT -> backend verification via JWKS -> request user context.
- Use `AuthGuard` and `@CurrentUser()` patterns from `apps/backend/src/common/auth`.
- Treat JWT `sub` as the canonical external identity.

## User Provisioning

- Use `getOrCreate` user semantics when authenticated routes require an internal user record.
- Map `sub` -> `User.externalId` and avoid alternate identity mapping paths.

## Dev Bypass Safety

- `AUTH_DEV_BYPASS=true` is development/test only.
- Do not enable or normalize bypass behavior for production code paths.

## Verification Requirements (Auth-Sensitive)

Changes touching auth guard, JWT verification, claims mapping, roles, or bypass must verify:
- Valid token path.
- Invalid token path.
- Missing token path.
- Dev bypass behavior only for non-production expectations.

Include negative permission-path checks where role or ownership affects authorization.
