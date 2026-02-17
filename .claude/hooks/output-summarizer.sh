#!/usr/bin/env zsh
set -euo pipefail

TOOL_EVENT=$(cat)
COMMAND=$(echo "$TOOL_EVENT" | jq -r '.tool_input.command // ""')

if [[ "$COMMAND" != *"pnpm install"* ]] && [[ "$COMMAND" != *"pnpm add"* ]]; then
  exit 0
fi

# Would need access to tool result output - simplified for now
exit 0
