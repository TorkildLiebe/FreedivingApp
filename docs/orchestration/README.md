# Codex-Native Milestone Orchestration

FreedivingApp now uses an agent-first orchestration flow instead of the legacy Node runner script.

## Entrypoint

Start runs from the Codex prompt window:

`use the monitor-agent role to run milestone <MILESTONE>`

Example:

`use the monitor-agent role to run milestone M2`

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

## Artifact Contract

For run id `<run-id>`:

- `docs/orchestration/runs/<run-id>/run.json`
- `docs/orchestration/runs/<run-id>/roadmap.md`
- `docs/orchestration/runs/<run-id>/issues/<issue-number>-plan.md`
- `docs/orchestration/runs/<run-id>/issues/<issue-number>-report.md`
- `docs/orchestration/improvements/<run-id>.md`

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

## Resume Behavior

Monitor-agent auto-resumes the latest unfinished run for the same milestone by reading run artifacts in `docs/orchestration/runs/`.

## Legacy Runner Status

The script-based runner (`scripts/orchestrator/milestone-manager.mjs`) is deprecated and no longer the primary workflow.
