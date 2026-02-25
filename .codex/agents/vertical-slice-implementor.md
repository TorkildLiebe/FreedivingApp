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
   - Before UI runtime verification, run: `pnpm orchestrator:mobile-auth-check`
   - For M2 map/spots runtime evidence when applicable, use:
     - `pnpm orchestrator:capture-ios-m2-core -- --run-id <run-id> --issue-number <n> [--device "<name>"]`
   - `VERIFICATION: FAIL` cannot be paired with `RESULT: PASS`.
   - If `MOBILE_UI_TOUCHED: true`, `IOS_VERIFIED` must be `true`.
   - If `MOBILE_UI_TOUCHED: false`, `IOS_VERIFIED` must be `false`.

5. Design OS gate for mobile/UI-impacting issues:
   - Use only `docs/design-os-plan` as canonical UI source.
   - Load `docs/design-os-plan/product-overview.md`, one matching incremental instruction file, and matching design assets:
     - `shell`: shell `README.md`, `components/`, screenshot references.
     - `map-and-spots` / `dive-reports` / `auth-and-profiles`: section `README.md`, `tests.md`, `components/`, `types.ts`, screenshot references.
   - Produce and follow a component mapping from Design OS components to target React Native files before edits.

6. Required UI evidence lines (inside existing required report sections):
   - `Design OS assets used:`
   - `Component mapping:`
   - `Design parity evidence:`
   - `Approved deviations:`
   - Missing these labels for `MOBILE_UI_TOUCHED: true` implies verification failure.

7. Implementer improvement artifact (append-only):
   - Write/update `docs/orchestration/vertical-slice-improvements/<issue-number>.md` for every issue run.
   - Append a new dated section per run with:
     - timestamp + run-id (or `run-id: standalone`)
     - `What slowed execution`
     - `Suggested process improvements`
   - Do not change existing final response section/trailer contracts.
