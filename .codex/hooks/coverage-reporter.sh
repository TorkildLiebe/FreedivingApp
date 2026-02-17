#!/usr/bin/env zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${(%):-%N}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

COMMAND="${1:-}"
if [[ -z "$COMMAND" ]]; then
  echo "Usage: $0 <command_string>" >&2
  exit 1
fi

COVERAGE_DIR=""
if [[ "$COMMAND" == *"--filter backend"* ]]; then
  COVERAGE_DIR="${REPO_ROOT}/apps/backend/coverage"
elif [[ "$COMMAND" == *"--filter mobile"* ]]; then
  COVERAGE_DIR="${REPO_ROOT}/apps/mobile/coverage"
else
  exit 0
fi

SUMMARY_FILE="${COVERAGE_DIR}/coverage-summary.json"
if [[ ! -f "$SUMMARY_FILE" ]]; then
  exit 0
fi

TOTAL_STATEMENTS=$(jq -r '.total.statements.pct' "$SUMMARY_FILE")

echo "Coverage: ${TOTAL_STATEMENTS}%" >&2
if (( $(echo "$TOTAL_STATEMENTS < 80" | bc -l) )); then
  echo "Warning: Below 80% target - open ${COVERAGE_DIR}/lcov-report/index.html" >&2
fi

exit 0
