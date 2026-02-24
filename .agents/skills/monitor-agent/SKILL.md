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

## Gate Logic

- iOS verification is required only when issue impact is mobile UI.
- Backend/docs issues can skip iOS verification with explicit reason.
- Android verification is currently informational and should be listed as residual risk when not run.

## Done Criteria

- Every completed issue is committed on its issue branch.
- Run artifacts and roadmap are updated after each transition.
- Milestone run stops on unresolved failure after retries.
- Milestone end includes retrospective with self-improvement actions.
