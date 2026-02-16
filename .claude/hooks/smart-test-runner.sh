#!/usr/bin/env zsh
set -euo pipefail

TOOL_EVENT=$(cat)
FILE_PATH=$(echo "$TOOL_EVENT" | jq -r '.tool_input.file_path // ""')

if [[ "$FILE_PATH" == *"apps/backend/src"* ]]; then
  BASE_NAME=$(basename "$FILE_PATH" .ts)
  DIR_NAME=$(dirname "$FILE_PATH")
  TEST_FILE="${DIR_NAME}/${BASE_NAME}.spec.ts"

  if [[ -f "$TEST_FILE" ]]; then
    echo "✨ Detected backend change - suggest: pnpm --filter backend test -- $(basename "$TEST_FILE")" >&2
  fi
elif [[ "$FILE_PATH" == *"apps/mobile/src"* ]]; then
  BASE_NAME=$(basename "${FILE_PATH%.*}")
  DIR_NAME=$(dirname "$FILE_PATH")

  if [[ -d "${DIR_NAME}/__tests__" ]]; then
    TEST_FILE="${DIR_NAME}/__tests__/${BASE_NAME}.test.tsx"
    if [[ -f "$TEST_FILE" ]]; then
      echo "✨ Detected mobile change - suggest: pnpm --filter mobile test -- $(basename "$TEST_FILE")" >&2
    fi
  fi
fi

exit 0
