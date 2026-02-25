# Codex-Native Milestone Orchestration

FreedivingApp now uses an agent-first orchestration flow instead of the legacy Node runner script.

## Entrypoint

Start runs from the Codex prompt window:

`use the monitor-agent role to run milestone <MILESTONE>`
`use the monitor-agent role to run milestone <MILESTONE> guided`

Example:

`use the monitor-agent role to run milestone M2`
`use the monitor-agent role to run milestone M2 guided`

## Roles

- `monitor-agent`: orchestrates milestone execution and run state.
- `vertical-slice-implementor`: plans, implements, verifies, and reports per issue.

Role registration is configured in:

- `.codex/config.toml`
- `.codex/agents.toml`

## Defaults

- Per-issue time cap: 45 minutes
- Full-run time cap: 360 minutes
- Retry budget: 2 retries
- Retry delay: 5 minutes
- Push policy: manual only (no auto-push)

## Run Modes

- `autonomous` (default):
  - Triggered by: `use the monitor-agent role to run milestone <MILESTONE>`
  - Never asks the user.
  - Resolves high-impact ambiguities in deterministic order:
    1. issue acceptance criteria/title/body
    2. domain/usecase/rules docs
    3. existing code/contracts and patterns
    4. lowest-risk reversible option

- `guided`:
  - Triggered by: `use the monitor-agent role to run milestone <MILESTONE> guided`
  - Asks only for unresolved high-impact ambiguities that materially change business rules, acceptance criteria interpretation, or user-flow behavior.
  - Each question must include context, 2-4 options, recommendation, and impact per option.
  - Unanswered required decisions pause the run; no fallback to autonomous mode.

## Artifact Contract

For run id `<run-id>`:

- `docs/orchestration/runs/<run-id>/run.json`
- `docs/orchestration/runs/<run-id>/roadmap.md`
- `docs/orchestration/runs/<run-id>/issues/<issue-number>-plan.md`
- `docs/orchestration/runs/<run-id>/issues/<issue-number>-report.md`
- `docs/orchestration/runs/<run-id>/issues/<issue-number>-decisions.md` (append-only decision log)
- `docs/orchestration/improvements/<run-id>.md`
- `docs/orchestration/vertical-slice-improvements/<issue-number>.md` (append-on-rerun)

`run.json` required fields:

- `run_id`
- `milestone`
- `status`
- `started_at`
- `updated_at`
- `issue_order`
- `current_issue`
- `attempts_by_issue`
- `completed_issues`
- `blocked_issue`
- `stop_reason`

Per-issue entry extension (backward-compatible):
- optional `commit_sha` to persist commit evidence for guarded close transitions.

Decision log entry extension (append-only, backward-compatible):
- timestamp
- mode (`autonomous|guided`)
- decision id/title
- ambiguity class (`business-rule|user-flow`)
- context summary
- options (+ impact)
- recommended option
- selected option
- decision source (`user|agent`)
- rationale
- affected scope

`roadmap.md` uses status transitions:

- `pending`
- `planning`
- `implementing`
- `verifying`
- `committed`
- `merged_local`
- `blocked`

## Worker Output Contract

The worker must return exactly these top-level headings:

- `## Changes made`
- `## Verification run`
- `## Not run / limitations`
- `## Risk notes`

Then append trailer lines:

- `RESULT: PASS|FAIL`
- `VERIFICATION: PASS|FAIL`
- `MOBILE_UI_TOUCHED: true|false`
- `IOS_VERIFIED: true|false`
- `ISSUE_NUMBER: <n>`

## Verification Gate

- Always run targeted verification for behavior changes.
- iOS simulator verification is required only for mobile/UI-impacting issues.
- Android verification is currently non-blocking and should be documented as residual risk when skipped.

## Orchestrator Utility Scripts

Run these from repository root:

- Mobile auth preflight:
  - `pnpm orchestrator:mobile-auth-check`
- Deterministic iOS M2 screenshot capture:
  - `pnpm orchestrator:capture-ios-m2-core -- --run-id <run-id> --issue-number <n> [--device "<name>"]`
- Atomic per-issue commit transition:
  - `pnpm orchestrator:transition-issue-commit -- --run-id <run-id> --issue <n> --commit-sha <sha> [--note "..."]`
- Guarded milestone close transition:
  - `pnpm orchestrator:close-milestone-run -- --run-id <run-id> [--milestone-branch <branch>]`
- Worker report contract validation:
  - `pnpm orchestrator:validate-worker-report -- --report-path docs/orchestration/runs/<run-id>/issues/<issue-number>-report.md --issue-number <n>`

The milestone retrospective artifact remains:
- `docs/orchestration/improvements/<run-id>.md`

## Resume Behavior

Monitor-agent auto-resumes the latest unfinished run for the same milestone by reading run artifacts in `docs/orchestration/runs/`.

If a run is paused with `stop_reason: awaiting_user_decision`:
- reuse the same run id
- resolve pending guided decisions first
- continue the previously blocked issue
- do not consume retry attempts for this pause reason

## Legacy Runner Status

The script-based runner (`scripts/orchestrator/milestone-manager.mjs`) is deprecated and no longer the primary workflow.
