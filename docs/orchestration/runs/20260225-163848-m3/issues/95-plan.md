# Issue #95 Plan

## Scope
- Add backend `POST /spots/:id/ratings` for create-or-update user rating on a spot.
- Recompute and persist `DiveSpot.averageRating` after each rating mutation.
- Wire mobile rating submission for both:
  - post-dive `RatingSheet` prompt flow,
  - spot-detail manual rating interaction.
- Enforce post-dive session behavior: if user taps "Not now", do not re-prompt again for that spot in the current app session.
- Keep labels/copy and interaction semantics aligned to Design OS for rating prompt.

## Risk tier
- High (cross-workspace mutation path + aggregate updates + mobile state/session behavior).

## Design OS bundle used for UI parity checks
- `docs/design-os-plan/product-overview.md`
- `docs/design-os-plan/instructions/incremental/03-dive-reports.md`
- `docs/design-os-plan/sections/dive-reports/{README.md,tests.md,components/RatingSheet.tsx,types.ts,screenshot.png}`
- `docs/design-os-plan/sections/map-and-spots/{README.md,tests.md,components/SpotDetailSheet.tsx}`

## Verification intent
- Backend targeted tests for controller/service/repository rating upsert and aggregate recompute.
- Mobile targeted tests for rating sheet labels, submit/dismiss behavior, and map-screen orchestration.
- Lint + type-check backend/mobile.
- `pnpm orchestrator:mobile-auth-check`.
- iOS simulator runtime screenshot evidence.
