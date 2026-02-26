# Issue #94 Decisions

## Pending decision (guided mode)
- decision id: M3-94-01
- ambiguity class: business-rule
- status: resolved
- context: issue #94 requires strict ownership + 48h window (403 non-owner, 422 expired), while `docs/USECASE.md` includes moderator/admin override for report edits.

## 2026-02-25T17:11:43Z - Guided mode decision resolution
- mode: guided
- decision id: M3-94-01
- ambiguity class: business-rule
- context summary: ownership enforcement conflict between issue acceptance and older usecase doc override.
- options:
  - Option 1: owner-only edits within 48h (strict)
    - impact: aligns exactly with issue acceptance criteria and UI expectations.
  - Option 2: allow moderator/admin override
    - impact: preserves older usecase semantics but conflicts with issue scope.
  - Option 3: hidden backend override only
    - impact: creates implicit behavior not represented in UI.
- recommended option: Option 1
- selected option: Option 1
- decision source: user
- rationale: user explicitly selected option 1 for this run.
- affected scope: edit permission checks in `PATCH /dive-logs/:id` and mobile edit-button visibility.
