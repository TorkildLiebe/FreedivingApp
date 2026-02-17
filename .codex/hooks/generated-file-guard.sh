#!/usr/bin/env zsh
set -euo pipefail

FILE_PATH="${1:-}"
if [[ -z "$FILE_PATH" ]]; then
  echo "Usage: $0 <file_path>" >&2
  exit 1
fi

FORBIDDEN_PATTERNS=("node_modules/" "/dist/" "/.expo/" "/.prisma/client/" "/ios/Pods/")

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "BLOCKED: Cannot edit generated file: $FILE_PATH" >&2
    if [[ "$FILE_PATH" == *".prisma/client"* ]]; then
      echo "To modify Prisma types, edit apps/backend/prisma/schema.prisma" >&2
    fi
    exit 2
  fi
done

if [[ "$FILE_PATH" == *"prisma/schema.prisma" ]]; then
  echo "Warning: Editing Prisma schema - remember to run: pnpm prisma:generate" >&2
fi

exit 0
