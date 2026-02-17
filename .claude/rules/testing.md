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
