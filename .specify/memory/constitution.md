<!--
SYNC IMPACT REPORT
==================
Version change: [TEMPLATE] → 1.0.0
Bump rationale: Initial ratification — template filled for the first time with DiveFreely-specific
  principles and governance rules. Treated as MAJOR (v1.0.0) because this establishes the
  constitution from scratch (no prior versioned content to compare against).

Modified principles: N/A — initial ratification, no prior principles existed.

Added sections:
  - Core Principles (I–VI, derived from DOMAIN.md, VISION.md, ARCHITECTURE.md, QUALITY.md)
  - Technology Stack & Constraints
  - Development Workflow
  - Governance

Removed sections: None.

Templates requiring updates:
  - .specify/templates/plan-template.md  ✅ "Constitution Check" gate already present; gates now
      reference the six principles defined here. No structural change needed.
  - .specify/templates/spec-template.md  ✅ Compliant as-is; mandatory sections align with
      constitution requirements (user stories, requirements, success criteria).
  - .specify/templates/tasks-template.md ✅ Compliant as-is; phase structure and test discipline
      align with Principle V (Test-Driven Quality).
  - .specify/templates/agent-file-template.md  ✅ Generic placeholder; no constitution references.
  - .specify/templates/checklist-template.md   ✅ Generic placeholder; no constitution references.

Follow-up TODOs:
  - TODO(RATIFICATION_DATE): Exact original project adoption date unknown. Set to TODO below.
    Resolve by checking earliest project commit timestamp.
-->

# DiveFreely Constitution

## Core Principles

### I. Domain Independence (NON-NEGOTIABLE)

Domain code MUST have zero dependencies on infrastructure layers (database, auth, storage,
frameworks). All external interactions MUST go through port interfaces (repository abstractions).

- No NestJS, Prisma, or Supabase imports inside domain entity or validation code.
- Repository interfaces are the only permitted bridge between domain and persistence.
- Infrastructure adapters (Prisma repositories, Supabase auth verifier, storage client) MUST be
  replaceable without touching domain or use-case logic.
- Any violation of this principle invalidates the modularity and testability guarantees of the
  entire codebase.

**Rationale**: Keeping domain logic framework-independent is the single most important structural
decision in this project. It enables unit testing without I/O, swapping Supabase for any OIDC
provider, and evolving persistence without rewriting business rules.

### II. Vertical Slice Architecture

Features MUST be organized as self-contained vertical slices (modules), not horizontal layers.
Each backend module MUST include its own controller, DTOs, service, domain types, and repository.
Each mobile feature MUST be self-contained under `src/features/<feature>/`.

- Cross-feature imports are only permitted through explicit shared contracts (types, utilities in
  `src/shared/` or `packages/shared`).
- Mobile dependency direction: `app/*` → `src/features/*` → `src/shared/*` → `src/infrastructure/*`.
  Reverse direction is forbidden.
- `src/shared/*` MUST NOT import from `src/features/*`.
- New modules MUST follow the existing folder conventions in `docs/ARCHITECTURE.md`.

**Rationale**: Vertical slices allow independent development, testing, and delivery of features.
Horizontal layering would create coupling that slows iteration on a single-developer project.

### III. Security & Auth First

Authentication and authorization MUST be applied before any write or owner-scoped read operation.
No endpoint that modifies data MUST be reachable without a valid verified JWT.

- JWT `sub` claim is the sole authoritative identity; never trust client-supplied user IDs.
- Role hierarchy: `user` < `moderator` < `admin`; enforce via `AuthGuard` + `RolesGuard`.
- Write operations (spots, reports, photos, ratings) MUST verify: authenticated + (owner OR
  moderator/admin).
- Input MUST be validated at DTO layer (class-validator) AND enforced by domain invariants
  server-side before persistence.
- Logging MUST NEVER include passwords, JWTs, pre-signed URLs, or personal data.
- Dev bypass (`AUTH_DEV_BYPASS=true`) is restricted to `NODE_ENV ∈ {development, test}`.

**Rationale**: Auth errors are among the most costly bugs to discover post-launch. Enforcing
security as a first-class constraint from the start prevents ownership bypass and data leakage.

### IV. Data Integrity & Invariant Enforcement

`docs/DOMAIN.md` is the single source of truth for all entity invariants, value object rules,
and error taxonomy. All invariants MUST be enforced server-side before any persistence operation.

- Coordinates are WGS84, rounded to 6 decimal places, and MUST NOT be mutable after creation.
- Soft delete = resource not found (404); deleted records MUST NOT be returned in listings.
- Text normalization: trim, collapse spaces; emoji forbidden in alias, bio, notes, captions.
- Proximity uniqueness for dive spots: reject if any non-deleted spot center is within 1000 m.
- Parking locations: max 5 per spot, each within 5000 m of center, no near-duplicates (<2 m).
- Edit window for dive reports: 48 hours; `moderator` and `admin` bypass this constraint.
- All domain errors MUST map to the error taxonomy in `docs/DOMAIN.md §3`.

**Rationale**: Centralizing invariants in DOMAIN.md ensures consistency across backend API,
tests, and future integrations. Server-side enforcement prevents data corruption regardless of
client behavior.

### V. Test-Driven Quality

Domain and use-case logic MUST achieve ≥ 80% code coverage. Behavior changes MUST include tests
or an explicit rationale for why tests cannot be added.

- Unit tests cover domain validations and entity invariants.
- Integration tests cover API endpoints with a test database: auth guards, CRUD, permission checks.
- CI pipeline MUST run lint, tests, and coverage on every commit/PR; failing CI blocks merge.
- Tests for a new behavior SHOULD be written before the implementation (red → green → refactor).
- Auth guards, SQL injection attempts, and ownership bypass scenarios MUST be covered in the
  test suite.

**Rationale**: A single-developer project with no QA team must rely on automated tests as the
safety net. 80% coverage on domain logic is the minimum to catch invariant regressions without
full manual regression testing.

### VI. Mobile-First, Minimal Complexity

The mobile app (iOS + Android) is the primary user interface. Web is explicitly out of scope.
Complexity MUST be justified; YAGNI applies. Features MUST serve divers planning or logging dives.

- API payloads for map endpoints MUST be minimal (e.g., BBOX listing: only `id`, `title`,
  `center`).
- Backend API average response time target: <300 ms; client load target: <2 s.
- No microservices for MVP: single modular-monolith backend.
- No realtime tracking, social feed, chat, or admin UI in MVP scope.
- Multilingual UI: Norwegian (default) and English; `preferredLanguage` stored per user.
- WCAG AA compliance baseline for accessibility.

**Rationale**: A clean, fast map and a quick dive-report flow are the core value proposition.
Premature complexity undermines trust in the data and slows iteration for a one-developer project.

## Technology Stack & Constraints

The following stack is fixed for MVP. Deviations require explicit constitution amendment.

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict) |
| Package manager | pnpm (monorepo) |
| Backend framework | NestJS (Fastify adapter) |
| ORM | Prisma |
| Database | Supabase Postgres + PostGIS |
| Auth | Supabase Auth (JWT/OIDC) + JWKS via `jose` |
| Object storage | Supabase Storage (pre-signed uploads) |
| Mobile | Expo React Native (iOS + Android only) |
| Navigation | Expo Router |
| Maps | MapLibre GL + Kartverket WMTS tiles |
| Testing | Jest (unit + Supertest e2e) |
| API docs | Swagger / OpenAPI (auto-generated) |

**Swappability contract**: DB, Auth, and Storage are replaceable via adapter interfaces. No direct
infrastructure imports inside domain or use-case code (see Principle I).

**GDPR constraints**: Collect only email (login), alias, and avatar. Deletion anonymizes
contributions. Kartverket map tiles MUST be attributed in the app.

## Development Workflow

- **Branches**: `main` is stable and deployable. Use scoped branches: `feat/<scope>`,
  `fix/<scope>`, `chore/<scope>`. Do NOT commit directly to `main`.
- **Commits**: Conventional commit format: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`,
  `test:`. Include issue number where applicable: `feat(#42): add spot rating endpoint`.
- **Pull Requests**: Link related issue or use case. Lint + tests MUST pass. Keep diffs small
  and focused. Checklist: ✅ build ✅ tests ✅ docs updated.
- **Docs sync**: Update `/docs` when behavior or contracts change. DOMAIN.md, ARCHITECTURE.md,
  and USECASE.md are source-of-truth documents; code must reconcile to them, not the reverse.
- **AI agents**: May scaffold, refactor, and test. MUST follow repo conventions. Human review
  required before merge. Must not commit or open PRs unless explicitly instructed.
- **No commits or PRs** without explicit user instruction, even when changes appear ready.

## Governance

This constitution supersedes all other practices, conventions, and prior implicit agreements.
When conflict exists between this document and any other source, this constitution takes
precedence. Discrepancies found in code or docs MUST be resolved toward this constitution.

**Amendment procedure**:
1. Propose change with rationale referencing affected principles or sections.
2. Determine version bump: MAJOR (principle removal or redefinition), MINOR (new principle or
   material expansion), PATCH (clarification, wording, non-semantic refinement).
3. Update this file, increment version, set `Last Amended` to today's date.
4. Run consistency propagation check against all templates in `.specify/templates/`.
5. Update `SYNC IMPACT REPORT` comment at top of this file.

**Compliance review**: All PRs and AI-generated plans MUST verify constitution compliance via the
"Constitution Check" gate in `.specify/templates/plan-template.md`. Complexity violations MUST be
justified in the `Complexity Tracking` table of `plan.md`.

**Runtime guidance**: `.claude/CLAUDE.md` and `.claude/rules/*.md` contain execution-level rules
for AI agents. These MUST remain consistent with this constitution; conflicts resolve to this
document.

---

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): resolve from earliest project commit | **Last Amended**: 2026-02-23
