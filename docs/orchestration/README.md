# PM Orchestrator

Milestone orchestrator CLI:

```bash
node scripts/orchestrator/milestone-manager.mjs \
  --milestone "M2" \
  --owner "TorkildLiebe" \
  --project-title "freedive-project"
```

Key behavior:
- Uses `implementationWorker.type = agent` and `implementationWorker.name = vertical-slice-implementor`.
- Processes milestone issues sequentially from GitHub project order.
- Creates milestone/issue branches under `codex/milestone/*` and `codex/issue/*`.
- Dispatches implementation via `codex exec` with `vertical-slice-implementor` contract.
- Requires worker final report sections:
  - `Changes made`
  - `Verification run`
  - `Not run / limitations`
  - `Risk notes`
- Stops on unresolved verification failure.
- Merges issue branches into milestone branch with `--no-ff`.
- Comments on the issue and attempts to mark project item status done.
- Pushes branches only at run end.

Run ledger output:
- `docs/orchestration/runs/<run-id>.json`
- `docs/orchestration/runs/<run-id>.md`
