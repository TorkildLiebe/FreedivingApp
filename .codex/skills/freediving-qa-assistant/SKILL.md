---
name: freediving-qa-assistant
description: Use to run runtime-first exploratory QA for FreedivingApp by deriving expectations from docs, testing the running app, and writing one final report with findings, doc drift, and QA-process improvements.
---

# Freediving QA Assistant

Use this skill for runtime-first exploratory QA runs. This skill defines a reusable method, not static feature scripts.

## Purpose

- Derive expected behavior from product, domain, and UI docs.
- Run the app and explore it directly.
- Treat runtime observation as the primary source of truth for reachable behavior.
- Generate a run-specific audit plan from docs, preflight, and runtime discovery.
- Execute exploratory QA with reusable heuristics.
- Write one report per run.
- Critique the QA workflow itself inside the report.
- Do not read implementation code to infer coverage.
- Do not run automated tests as part of QA.

## Inputs

- `mode`: `full-sweep | feature-audit`
- `feature`: optional unless `mode=feature-audit`
- `scope_override`: optional boolean
- `environment`: seeded local or seeded dev target
- `auth_state`: `guest | authenticated | both`

## Required Sources

Read only the sources needed for the current run, in this order:

1. `docs/ROADMAP.md`
2. `docs/DOMAIN.md`
3. `docs/USECASE.md`
4. `docs/design-os-plan/product-overview.md`
5. relevant `docs/design-os-plan/instructions/incremental/*.md`
6. relevant `docs/design-os-plan/sections/*`
7. `docs/UI_DESIGN.md`

Use `docs/ROADMAP.md` as the documented scope reference, but do not let it prevent runtime verification of reachable surfaces.

## Runtime Tooling

Use runtime tooling in this order:

1. Run `pnpm qa:preflight`
2. If the app is not installed, run `pnpm qa:ios:ensure-app`
3. For UI runtime verification, prefer the `ios-simulator` MCP server
4. If the MCP server is unavailable, follow `.claude/skills/ios-simulator-skill/SKILL.md`
5. If richer interaction is blocked, run `pnpm qa:smoke:ios` for baseline runtime evidence
6. Do not use Maestro or other Java-dependent checks as the default path
7. Do not run repository automated tests during QA runs

## Scope Derivation

1. Read roadmap milestones in order to understand documented scope.
2. In `full-sweep`, start from documented expectations, then treat every user-visible surface you can actually reach in the running app as active audit scope.
3. In `feature-audit`, prioritize the requested feature, but still record adjacent unexpected reachable surfaces when they materially affect the flow.
4. If a documented feature cannot be found or reached in the app, report it as missing or misaligned.
5. If a feature is reachable in the app but absent from current docs, classify it as drift.
6. Build the run plan dynamically from what is documented and what is reachable at runtime.

## Runtime Discovery

Build the run plan dynamically. Do not use or create static per-feature checklists.

For each scoped feature area:

1. Map it to the most relevant `docs/design-os-plan` section or shell bundle.
2. Read the matching design docs to infer intended flows and UI states.
3. Launch the app and navigate the reachable user-facing surfaces.
4. Record the runtime-discovered surfaces:
   - screens
   - sheets
   - forms
   - navigation entry points
   - auth state required
   - backend dependency observed
   - blockers preventing deeper coverage
5. Build a run-specific audit sequence from the observed surfaces.

## Internal Test-Plan Synthesis

Generate an internal plan for the current run with these parts:

1. Scope selection
   - documented features in scope
   - runtime-reachable surfaces in scope
   - documented-but-unreachable features
   - reachable-but-undocumented features
2. Expectation synthesis
   - intended product behavior from docs
   - UI/component expectations from `docs/UI_DESIGN.md`
   - business rules from `docs/DOMAIN.md` and `docs/USECASE.md`
3. Surface map
   - preflight result
   - entry points
   - runtime-discovered user-facing surfaces
   - auth state needed
   - reachable navigation paths
   - observed blockers
4. Audit sequence
   - deterministic feature order from roadmap + runtime discovery
   - deterministic surface order from observed primary flows
5. Exploratory probes
   - heuristic families chosen for each surface

Summarize this generated plan inside the final report under `## Generated Test Plan`. Do not persist it as a separate artifact.

## Exploratory Heuristics

Choose heuristics dynamically based on the discovered surface. Use the smallest relevant set that gives broad coverage.

### Navigation

- back
- close
- cancel
- switching tabs or screens mid-flow
- entering flows in unusual order

### Input Boundaries

- empty
- max length
- whitespace-only
- invalid format
- repeated toggles

### Timing

- retry after loading
- double-tap
- tap while pending
- reopen after dismiss

### State Continuity

- partially complete a flow
- leave the surface
- return
- verify whether state correctly persists or resets

### Feedback Quality

- confirm whether success is clear
- confirm whether failure is specific
- confirm whether recovery is obvious

### UX Efficiency

- extra steps
- hidden primary actions
- unclear affordances
- weak defaults

### UI Consistency

- spacing
- clipping
- overlap
- visual hierarchy
- touch target usability
- contrast

### Plan Alignment

- missing planned behavior
- behavior that contradicts docs
- unexpected extra behavior worth flagging

## Evidence Expectations

- Capture runtime evidence whenever possible, especially for UI findings.
- Prefer simulator screenshots and observed interaction traces for UI findings.
- Use runtime evidence first; only describe blockers when runtime evidence cannot be captured.
- Reference screenshots inline in the report when captured.
- If evidence cannot be captured, note the exact limitation.
- `## Summary` must include the preflight result and chosen runtime mode.
- `## Generated Test Plan` must include the preflight outcome, reachable surfaces, and excluded surfaces due to blockers.
- `## Not Covered / Blockers` must be populated directly from preflight and runtime obstacles.
- `## Missing Or Misaligned Features` must explicitly compare:
  - docs that describe behavior not present in the app
  - app behavior present but absent from docs
  - business-rule mismatches against `docs/DOMAIN.md` and `docs/USECASE.md`
- Do not create separate required run artifacts beyond the report unless screenshot evidence is captured.

## Findings Classification

Use this schema for every finding:

- `ID`
- `Severity`: `P0 | P1 | P2 | P3`
- `Type`: `bug | ux | ui | missing-feature | doc-drift | roadmap-drift`
- `Feature`
- `Surface`
- `Reproduction`
- `Expected`
- `Observed`
- `Impact`
- `Recommendation`
- `Evidence`
- `Source references`

Severity guidance:

- `P0`: blocks core use or risks data loss/security
- `P1`: serious functional breakage or major UX failure
- `P2`: meaningful defect, friction, or design mismatch
- `P3`: minor polish issue or low-risk inconsistency

Type guidance:

- `bug`: runtime behavior is broken or unstable
- `ux`: runtime behavior works but causes unnecessary friction or confusion
- `ui`: runtime layout, interaction affordance, or visual quality issue
- `missing-feature`: docs promise a feature or flow that is missing or unreachable in runtime
- `doc-drift`: runtime behavior conflicts with `docs/DOMAIN.md`, `docs/USECASE.md`, `docs/UI_DESIGN.md`, or `docs/design-os-plan`
- `roadmap-drift`: a runtime-visible feature exists outside the declared roadmap scope

## Report Contract

Write exactly one report per run to `docs/qa/reports/<run-id>.md`.

Use a sortable timestamp run id:

- `qa-YYYY-MM-DDTHH-MM-SS`

The report must contain these headings:

- `## Summary`
- `## Scope Derived From Roadmap`
- `## Generated Test Plan`
- `## Findings`
- `## Missing Or Misaligned Features`
- `## UX/UI Recommendations`
- `## Roadmap Drift`
- `## Not Covered / Blockers`
- `## QA Agent Self-Improvement`
- `## Risk Notes`

## Blocked Run Behavior

- If `pnpm qa:preflight` returns `blocked`, stop before deeper auditing.
- Produce a report that documents the blocker, any baseline evidence captured, and the residual risk.
- Do not fabricate findings from implementation code when the runtime is blocked.

## QA Agent Self-Improvement

Always include a short self-audit of the QA workflow itself:

- what could not be assessed confidently
- where source discovery was ambiguous
- where docs were stale, vague, or conflicting
- which heuristics produced low-signal results
- which heuristics produced high-value findings
- what should change in the role prompt or this skill
- what missing tooling would improve future evidence quality

## Guardrails

- Do not modify source code during a QA run.
- Do not convert this workflow into static feature test scripts.
- Do not silently widen scope beyond checked roadmap items unless `scope_override=true`.
- When roadmap and code disagree, report the disagreement explicitly.
- If seed data or environment state blocks meaningful coverage, state the blocker instead of guessing.
