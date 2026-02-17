#!/usr/bin/env zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${(%):-%N}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "$REPO_ROOT"

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
if [[ -z "$STAGED_FILES" ]]; then
  echo "No files staged" >&2
  exit 2
fi

BACKEND_FILES=$(echo "$STAGED_FILES" | grep "^apps/backend/src" || true)
MOBILE_FILES=$(echo "$STAGED_FILES" | grep "^apps/mobile/src" || true)

if [[ -n "$BACKEND_FILES" ]]; then
  echo "Running backend type-check for staged backend files..." >&2
  pnpm --filter backend type-check --noEmit
fi

if [[ -n "$MOBILE_FILES" ]]; then
  echo "Running mobile type-check for staged mobile files..." >&2
  pnpm --filter mobile type-check --noEmit
fi

exit 0
