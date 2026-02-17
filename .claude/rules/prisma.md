---
paths:
  - "apps/backend/prisma/**"
  - "apps/backend/src/**"
---
# Prisma and Database Rules

## Schema and Migrations

- Keep Prisma schema changes backward-aware and intentional.
- Prefer additive migrations for active development unless explicitly performing a reset workflow.
- Preserve naming/mapping conventions used by existing models.

## Query Patterns

- Place persistence logic in repositories, not controllers.
- Keep spatial and heavy queries explicit and test-covered.
- For multi-entity writes, use transactions.

## Integrity

- Enforce domain invariants before persistence.
- Validate ownership/authorization prior to destructive or mutating operations.
- Avoid silent coercion that can hide invalid domain state.
