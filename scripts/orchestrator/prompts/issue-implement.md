Dispatch agent: vertical-slice-implementor

Run this command contract:
`/verticalslice.implement {{ISSUE_NUMBER}} {{IMPLEMENTATION_NOTES}}`

Issue metadata:
- Number: {{ISSUE_NUMBER}}
- Title: {{ISSUE_TITLE}}
- URL: {{ISSUE_URL}}

Hard requirements:
1. Use the `vertical-slice-implementor` agent workflow.
2. Complete full lifecycle: Understand -> Plan -> Implement -> Verify -> Report.
3. Final response must contain exactly these top-level sections:
## Changes made
## Verification run
## Not run / limitations
## Risk notes
4. If verification remains failing, state this explicitly in `Verification run`.
