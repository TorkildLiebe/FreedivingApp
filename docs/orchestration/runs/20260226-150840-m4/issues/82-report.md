## Changes made
- Added backend profile edit contracts and endpoints in users module:
  - `PATCH /users/me` for alias/bio/avatar persistence.
  - `POST /users/me/avatar/upload-url` for avatar signed upload URL creation.
  - New DTOs: `update-me.dto.ts`, `create-avatar-upload-url.dto.ts`, `avatar-upload-url-response.dto.ts`.
  - New storage helper: `user-avatar-storage.service.ts`.
  - Users service/repository/controller/module wired for edit + upload-url flow.
- Added backend tests for new profile editing and avatar upload-url behavior:
  - `users.controller.spec.ts`
  - `users.service.spec.ts`
  - `users.repository.spec.ts`
- Implemented inline profile editing on mobile profile screen:
  - Edit mode with alias/bio fields, character limits, validation, save/cancel actions.
  - Avatar replace/remove controls with image picker + signed URL PUT upload.
  - Save path persists through `/users/me` and refreshes profile data.
  - Files: `profile-screen.tsx`, `profile.ts`, `profile-screen.test.tsx`.
- Added Maestro verification flow for inline profile edit:
  - `apps/mobile/.maestro/flows/auth/profile-inline-edit.yaml`.
  - Includes validation-state assertion and cancel/back-to-view assertion.

Design OS assets used:
- `docs/design-os-plan/product-overview.md`
- `docs/design-os-plan/instructions/incremental/04-auth-and-profiles.md`
- `docs/design-os-plan/sections/auth-and-profiles/README.md`
- `docs/design-os-plan/sections/auth-and-profiles/tests.md`
- `docs/design-os-plan/sections/auth-and-profiles/types.ts`
- `docs/design-os-plan/sections/auth-and-profiles/components/ProfilePage.tsx`
- `docs/design-os-plan/sections/auth-and-profiles/screenshot-profile.png`

Component mapping:
- Design `ProfilePage` inline header edit form -> mobile `profile-screen.tsx` `isEditing` header branch.
- Design avatar edit behavior -> avatar replace/remove controls + backend signed upload URL flow.
- Design profile save/cancel behavior -> `Save` persists to backend and `Cancel` exits edit mode without persistence.
- Design validation expectation for profile edits -> inline alias-required and max-length validation messaging.

Design parity evidence:
- Maestro runtime verification (iOS):
  - `PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" maestro test apps/mobile/.maestro/flows/auth/profile-shell.yaml apps/mobile/.maestro/flows/auth/profile-inline-edit.yaml` -> PASS (2/2).
- iOS screenshots captured from Maestro flow:
  - `docs/orchestration/runs/20260226-150840-m4/issues/evidence/82-inline-edit-mode-ios.png`
  - `docs/orchestration/runs/20260226-150840-m4/issues/evidence/82-inline-edit-validation-ios.png`

Approved deviations:
- Maestro flow uses a second `tapOn` for `profile-save-button` before validation assertion to handle iOS keyboard-dismiss behavior in `ScrollView` (first tap dismisses keyboard, second tap submits).

## Verification run
- `pnpm --filter backend test -- users.controller.spec.ts users.service.spec.ts users.repository.spec.ts` -> PASS
- `pnpm --filter backend type-check` -> PASS
- `pnpm --filter backend lint` -> FAIL (unrelated pre-existing errors in `apps/backend/src/modules/dive-logs/dive-logs.service.spec.ts`)
- `pnpm --filter mobile test -- profile-screen.test.tsx use-profile-data.test.tsx` -> PASS
- `pnpm --filter mobile lint` -> PASS
- `pnpm --filter mobile type-check` -> PASS
- `PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" pnpm orchestrator:mobile-auth-check` -> PASS
- `PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" maestro test apps/mobile/.maestro/flows/auth/profile-shell.yaml apps/mobile/.maestro/flows/auth/profile-inline-edit.yaml` -> PASS
- `PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" maestro -p android test apps/mobile/.maestro/flows/auth/profile-shell.yaml apps/mobile/.maestro/flows/auth/profile-inline-edit.yaml` -> FAIL (0 Android devices connected)

## Not run / limitations
- Android runtime screenshot verification is blocked in this environment:
  - `maestro -p android test ...` reports `0 devices connected`.
  - `maestro start-device --platform android --os-version 33` fails because `ANDROID_HOME`/`ANDROID_SDK_ROOT` is not configured.
- Backend lint remains blocked by unrelated existing errors in `apps/backend/src/modules/dive-logs/dive-logs.service.spec.ts`.

## Risk notes
- Residual risk: Android-specific keyboard/scroll/tap behavior for inline profile editing is not runtime-verified.
- Residual risk: avatar upload path depends on external storage credentials and network; unit and iOS UI flow pass, but production bucket policy mismatches would surface only in integrated environments.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 82
