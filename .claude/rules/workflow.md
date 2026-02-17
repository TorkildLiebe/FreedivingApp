---
paths:
  - "**"
---
# Workflow Rules

## Branching and Commits

- Do not commit directly to `main`.
- Use scoped branches (`feat/<scope>`, `fix/<scope>`, `chore/<scope>`).
- Follow repository commit message expectations and hooks.

## Change Scope

- Prefer small, focused diffs over broad rewrites.
- Avoid introducing new architecture when existing patterns solve the problem.
- Keep docs in sync when behavior or contracts change.

## Ambiguity and Assumptions

- If ambiguity can change behavior or risk profile, ask before implementation.
- If assumptions are used, list them explicitly in final delivery.
- If docs and code conflict, resolve against source-of-truth docs and note the discrepancy.

## Verification Reporting Contract

No silent completion. Final delivery must include verification evidence:
- Commands run.
- Result per command.
- Residual risk.
- Unrun checks and rationale.

## Collaboration and Safety

- Do not create commits or PRs without explicit user instruction.
- Surface unresolved questions briefly when planning and before high-risk edits.
