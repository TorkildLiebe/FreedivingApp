---
name: monitor-agent-sop
description: Codex-native unattended milestone orchestration SOP for FreedivingApp.
---

# Monitor Agent Skill

Use this skill when running a full milestone from the prompt window with no external runner script.

## Start Command

Use a fixed trigger phrase:

`use the monitor-agent role to run milestone <MILESTONE>`

Example:

`use the monitor-agent role to run milestone M2`

## Run Defaults

- per-issue cap: 45 minutes
- full-run cap: 360 minutes
- retries: 2
- retry delay: 5 minutes
- push policy: manual only (no auto-push)

## Required Artifacts

For run id `<run-id>`:

- `docs/orchestration/runs/<run-id>/run.json`
- `docs/orchestration/runs/<run-id>/roadmap.md`
- `docs/orchestration/runs/<run-id>/issues/<issue-number>-plan.md`
- `docs/orchestration/runs/<run-id>/issues/<issue-number>-report.md`
- `docs/orchestration/improvements/<run-id>.md`

## Worker Delegation

Delegate implementation tasks to `vertical-slice-implementor`.

Require worker output:

- Required headings:
  - `## Changes made`
  - `## Verification run`
  - `## Not run / limitations`
  - `## Risk notes`
- Required trailer:
  - `RESULT: PASS|FAIL`
  - `VERIFICATION: PASS|FAIL`
  - `MOBILE_UI_TOUCHED: true|false`
  - `IOS_VERIFIED: true|false`
  - `ISSUE_NUMBER: <n>`

For mobile/UI-impacting issues, require these evidence labels in worker report sections:
- `Design OS assets used:`
- `Component mapping:`
- `Design parity evidence:`
- `Approved deviations:`

## Design OS Source Rule

- Canonical UI design source is only `docs/design-os-plan`.
- For UI issues, require the worker intake to include:
  - `docs/design-os-plan/product-overview.md`
  - one matching incremental instruction file under `docs/design-os-plan/instructions/incremental/`
  - matching design assets:
    - `shell`: shell `README.md`, `components/`, and screenshot files
    - `map-and-spots` / `dive-reports` / `auth-and-profiles`: section `README.md`, `tests.md`, `components/`, `types.ts`, and screenshot files
- Pass these exact file paths to `vertical-slice-implementor` via implementation notes.

## Gate Logic

- iOS verification is required only when issue impact is mobile UI.
- Backend/docs issues can skip iOS verification with explicit reason.
- Android verification is currently informational and should be listed as residual risk when not run.
- If `MOBILE_UI_TOUCHED: true`, missing Design OS intake/parity evidence is a failed attempt and enters retry flow.
- Before UI-runtime verification work, run mobile auth preflight:
  - `pnpm orchestrator:mobile-auth-check`

## State Transition Commands

- After a successful issue commit, transition run-state + roadmap atomically:
  - `pnpm orchestrator:transition-issue-commit -- --run-id <run-id> --issue <n> --commit-sha <sha> [--note "..."]`
- At milestone end, perform guarded close transition:
  - `pnpm orchestrator:close-milestone-run -- --run-id <run-id> [--milestone-branch <branch>]`
- For deterministic M2 iOS evidence capture when UI states must be proven:
  - `pnpm orchestrator:capture-ios-m2-core -- --run-id <run-id> --issue-number <n> [--device "<name>"]`

## Done Criteria

- Every completed issue is committed on its issue branch.
- Run artifacts and roadmap are updated after each transition.
- Milestone run stops on unresolved failure after retries.
- Milestone end includes retrospective with self-improvement actions.
