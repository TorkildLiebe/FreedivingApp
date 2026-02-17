#!/usr/bin/env zsh
set -euo pipefail

cd /Users/torkildliebe/FreedivingApp

# Only run on git commit commands (safety check in case matcher doesn't filter)
if [[ "${TOOL_INPUT:-}" != *"git commit"* ]] 2>/dev/null; then
  exit 0
fi

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
if [[ -z "$STAGED_FILES" ]]; then
  echo "⚠️  No files staged" >&2
  exit 2
fi

BACKEND_FILES=$(echo "$STAGED_FILES" | grep "^apps/backend/src" || true)
MOBILE_FILES=$(echo "$STAGED_FILES" | grep "^apps/mobile/src" || true)

if [[ -n "$BACKEND_FILES" ]]; then
  if ! pnpm --filter backend type-check --noEmit 2>&1 | head -20; then
    echo "❌ Backend type check failed" >&2
    exit 2
  fi
fi

if [[ -n "$MOBILE_FILES" ]]; then
  if ! pnpm --filter mobile type-check --noEmit 2>&1 | head -20; then
    echo "❌ Mobile type check failed" >&2
    exit 2
  fi
fi

exit 0
