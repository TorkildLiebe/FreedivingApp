---
name: monitor-agent-sop
description: Codex-native milestone orchestration SOP for FreedivingApp with two run modes: autonomous (`use the monitor-agent role to run milestone <MILESTONE>`) and guided (`use the monitor-agent role to run milestone <MILESTONE> guided`) for high-impact business-rule and user-flow decisions.
---

# Monitor Agent Skill

Use this skill when running a full milestone from the prompt window with no external runner script.

## Start Command

Use one of two trigger phrases:

`use the monitor-agent role to run milestone <MILESTONE>`
`use the monitor-agent role to run milestone <MILESTONE> guided`

Example:

`use the monitor-agent role to run milestone M2`
`use the monitor-agent role to run milestone M2 guided`

## Run Modes

- `autonomous` (default trigger without suffix):
  - Never ask the user.
  - Resolve high-impact ambiguities by precedence:
    1. issue acceptance criteria/title/body
    2. domain/usecase/rules docs
    3. existing code/contracts and patterns
    4. lowest-risk reversible option
  - Append each resolved decision to the decision artifact with `decision_source: agent`.

- `guided` (trigger with `guided` suffix):
  - Ask only for unresolved high-impact ambiguities that change business rules, acceptance criteria interpretation, or user-flow behavior.
  - Ask with this structure:
    - context summary
    - ambiguity class (`business-rule|user-flow`)
    - 2-4 options
    - recommended option
    - impact for each option
  - If no answer is available, pause run immediately (do not fallback to autonomous mode).

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
- `docs/orchestration/runs/<run-id>/issues/<issue-number>-decisions.md` (append-only)
- `docs/orchestration/improvements/<run-id>.md`

Decision artifact entries must include:
- timestamp
- mode (`autonomous|guided`)
- decision id/title
- ambiguity class (`business-rule|user-flow`)
- context summary
- options (+ impact)
- recommended option
- selected option
- decision source (`user|agent`)
- rationale and affected scope

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
- Validate every worker report with:
  - `pnpm orchestrator:validate-worker-report -- --report-path docs/orchestration/runs/<run-id>/issues/<issue-number>-report.md --issue-number <n>`
- If validation fails (including missing Design OS intake/parity evidence for UI issues), treat it as a failed attempt and enter retry flow.
- In guided mode, unanswered required decisions are not failed attempts:
  - mark issue blocked with `pending decision`
  - persist `blocked_issue` and `stop_reason: awaiting_user_decision`
  - stop run without consuming retry budget
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
- For reused runs with `stop_reason: awaiting_user_decision`, resolve pending decisions first and continue the blocked issue.
- Milestone run stops on unresolved failure after retries.
- Milestone end includes retrospective with self-improvement actions.
