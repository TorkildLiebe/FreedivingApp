---
paths:
  - "apps/**"
  - "packages/shared/**"
---
# Testing Rules

## Verification Policy

Use risk-based strict verification. Start targeted, then scale up with risk.

### Risk Tiers

- Low risk: localized text/docs/config updates with no behavior change.
- Medium risk: module-level logic change inside one app/workspace.
- High risk: cross-module changes, auth/security/permissions, schema or migration changes, concurrency-sensitive flows, or data integrity logic.

### Required Checks by Tier

- Low risk:
  - Run at least one relevant targeted check (or static validation) for changed scope.
- Medium risk:
  - Run targeted tests for touched behavior.
  - Run lint and type-check in affected workspace(s).
- High risk:
  - Run broader test scope in affected workspace(s), including integration/e2e where relevant.
  - Run lint and type-check.
  - If mobile-impacting, verify both iOS and Android behavior paths.

Use `package.json` scripts as command source where possible.

## Verification Output Contract

Final response must report:
- Exact commands run.
- Outcome per command (pass/fail).
- Residual risk statement.
- Any unrun checks and rationale.

## Failure Handling

If a verification check fails:
- Stop and diagnose.
- Fix the issue (or document blocker).
- Rerun relevant checks.
- Report final state transparently.

## Test Design

- Test invariants and permission boundaries, not only happy paths.
- Add regression tests for bug fixes.
- Keep fixtures deterministic and understandable.
- Align quality expectations with `docs/QUALITY.md` (including ~80% target for core logic).

## E2E Testing (Maestro)

Maestro flows live in `apps/mobile/.maestro/flows/`. Run with `pnpm test:e2e:mobile`.

### When to Write E2E Tests

- New screen or major screen-level feature: add a happy-path E2E flow.
- New multi-step interaction flow (e.g., create spot, submit dive log): add a full-sequence flow.
- Bug fix involving navigation or component integration: add a regression flow.
- Tab or navigation structure changes: update smoke flows.

### When NOT to Write E2E Tests

- Pure logic changes in hooks/utilities (covered by Jest unit tests).
- Styling-only changes with no interaction changes.
- Backend-only changes.

### Flow Organization

- `smoke/`: Critical path tests. Must always pass. No backend dependency.
- `<feature>/`: Feature-specific flows grouped by domain.
- `helpers/`: Reusable sub-flows (login, permission dismissal).

### Flow Writing Conventions

- Start each flow with `stopApp` + `launchApp` for clean state between flows.
- Use `id` selector (maps to React Native `testID`) for interactive elements.
- Text-based selectors (`assertVisible: "Some Text"`) are acceptable for content verification.
- Use `extendedWaitUntil` with explicit timeout for async operations (app launch: 15s, API calls: 10s, animations: 5s).
- Use `assertVisible` (no timeout) for elements expected to already be present.
- Name flows descriptively: `<feature>-<scenario>.yaml`.
- Keep individual flows under 50 steps. Break larger sequences into sub-flows via `runFlow`.
- Tag backend-dependent flows with `requires-backend`.

### Relationship to Unit Tests

- Unit tests (Jest + RNTL): Test component logic, hook behavior, state management in isolation. ~80% coverage target.
- E2E tests (Maestro): Test real user flows on a real device/simulator. Cover critical paths and regressions.
- Both layers are complementary. E2E tests catch integration and navigation bugs that unit tests miss. Unit tests catch logic edge cases that E2E tests are too slow to cover.
- Use the `/test-mobile` skill for generating both unit tests and E2E flows for new features.
