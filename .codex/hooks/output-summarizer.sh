#!/usr/bin/env zsh
set -euo pipefail

COMMAND="${1:-}"
if [[ -z "$COMMAND" ]]; then
  echo "Usage: $0 <command_string>" >&2
  exit 1
fi

if [[ "$COMMAND" != *"pnpm install"* ]] && [[ "$COMMAND" != *"pnpm add"* ]]; then
  exit 0
fi

# Command-only parity placeholder.
exit 0
