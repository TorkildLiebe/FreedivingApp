#!/usr/bin/env zsh
set -euo pipefail

FILE_PATH="${1:-}"
if [[ -z "$FILE_PATH" ]]; then
  echo "Usage: $0 <file_path>" >&2
  exit 1
fi

if [[ "$FILE_PATH" == *"apps/backend/src"* ]]; then
  BASE_NAME=$(basename "$FILE_PATH" .ts)
  DIR_NAME=$(dirname "$FILE_PATH")
  TEST_FILE="${DIR_NAME}/${BASE_NAME}.spec.ts"

  if [[ -f "$TEST_FILE" ]]; then
    echo "Detected backend change - suggest: pnpm --filter backend test -- $(basename "$TEST_FILE")" >&2
  fi
elif [[ "$FILE_PATH" == *"apps/mobile/src"* ]]; then
  BASE_NAME=$(basename "${FILE_PATH%.*}")
  DIR_NAME=$(dirname "$FILE_PATH")

  if [[ -d "${DIR_NAME}/__tests__" ]]; then
    TEST_FILE_TSX="${DIR_NAME}/__tests__/${BASE_NAME}.test.tsx"
    TEST_FILE_TS="${DIR_NAME}/__tests__/${BASE_NAME}.test.ts"
    if [[ -f "$TEST_FILE_TSX" ]]; then
      echo "Detected mobile change - suggest: pnpm --filter mobile test -- $(basename "$TEST_FILE_TSX")" >&2
    elif [[ -f "$TEST_FILE_TS" ]]; then
      echo "Detected mobile change - suggest: pnpm --filter mobile test -- $(basename "$TEST_FILE_TS")" >&2
    fi
  fi
fi

exit 0
