# Doc Audit Report Template

Use this structure when producing a documentation audit report.

## Report Format

```markdown
# Doc Audit Report — [Date]

## Summary
[1-2 sentences: overall doc health and the most important finding]

## Current Milestone
[Which milestone we're in based on design-os-plan, what's the focus]

## Conflicts Found
[Where design-os-plan disagrees with older docs]

| Topic | design-os-plan says | Older doc says | Doc | Recommendation |
|-------|-------------------|----------------|-----|----------------|
| ...   | ...               | ...            | ... | ...            |

## Gaps
[Things that should be documented but aren't]

- [ ] [Gap description] — Impact: [high/medium/low]

## Stale Information
[Docs that reference things that no longer exist or have changed]

- [ ] [What's stale] in [which doc] — [what changed]

## Missing Docs
[Documents that should exist but don't]

- [ ] [Suggested doc] — [why it's needed]

## Action Items (Priority Order)
1. [Most important fix — usually conflicts that could cause wrong implementation]
2. [Next most important]
3. ...

## Doc Health Score
- Conflicts: [count] ([high/medium/low] severity)
- Gaps: [count]
- Stale items: [count]
- Overall: [Healthy / Needs attention / Needs significant work]
```

## Severity Guidelines

**High severity** — Could cause wrong implementation:
- Business rule conflicts between design-os-plan and DOMAIN.md
- Feature scope differences between design-os-plan and USECASE.md
- Architecture contradictions

**Medium severity** — Causes confusion but not wrong code:
- Missing documentation for planned features
- Outdated examples or file paths
- Incomplete cross-references

**Low severity** — Cosmetic or minor:
- Formatting inconsistencies
- Minor wording differences that don't change meaning
- TODOs that haven't been cleaned up
