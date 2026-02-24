---
description: Delegate issue-driven implementation to the dedicated vertical-slice-implementor agent.
handoffs:
  - label: Run Dedicated Implementor
    agent: vertical-slice-implementor
    prompt: Implement this issue end-to-end with mandatory tests and risk-tier verification.
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Command Interface

`/verticalslice.implement <issue-number> [implementation-notes]`

- `issue-number` is required and must be numeric.

## Delegation Workflow

1. Parse the first token from `$ARGUMENTS` as `ISSUE_NUMBER`.
2. If `ISSUE_NUMBER` is missing or not numeric, stop and return:
   - `Usage: /verticalslice.implement <issue-number> [implementation-notes]`
3. Delegate the full implementation flow to `vertical-slice-implementor`.
4. Pass all user arguments (`send: true`) so issue number and notes reach the agent.
