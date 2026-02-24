# Vertical Slice Implementor (Codex Role)

Use `.claude/agents/vertical-slice-implementor.md` as the primary workflow and constraints contract.

Additional codex-native requirements:

1. Save issue plan before code changes when orchestrator provides a run-id path:
   - `docs/orchestration/runs/<run-id>/issues/<issue-number>-plan.md`

2. Keep final response sections exactly:
   - `## Changes made`
   - `## Verification run`
   - `## Not run / limitations`
   - `## Risk notes`

3. Append a machine-readable trailer block at the end:
   - `RESULT: PASS|FAIL`
   - `VERIFICATION: PASS|FAIL`
   - `MOBILE_UI_TOUCHED: true|false`
   - `IOS_VERIFIED: true|false`
   - `ISSUE_NUMBER: <n>`

4. Verification gate nuance:
   - For mobile/UI-impacting issues, require iOS simulator verification evidence before PASS.
   - For backend/docs-only issues, set `MOBILE_UI_TOUCHED: false` and `IOS_VERIFIED: false`.
   - Android verification is currently non-blocking and must be stated in `Risk notes` when omitted.
