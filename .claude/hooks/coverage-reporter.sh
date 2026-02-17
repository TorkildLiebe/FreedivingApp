#!/usr/bin/env zsh
set -euo pipefail

TOOL_EVENT=$(cat)
COMMAND=$(echo "$TOOL_EVENT" | jq -r '.tool_input.command // ""')

WORKSPACE=""
if [[ "$COMMAND" == *"--filter backend"* ]]; then
  COVERAGE_DIR="/Users/torkildliebe/FreedivingApp/apps/backend/coverage"
elif [[ "$COMMAND" == *"--filter mobile"* ]]; then
  COVERAGE_DIR="/Users/torkildliebe/FreedivingApp/apps/mobile/coverage"
else
  exit 0
fi

SUMMARY_FILE="${COVERAGE_DIR}/coverage-summary.json"
if [[ ! -f "$SUMMARY_FILE" ]]; then
  exit 0
fi

TOTAL_STATEMENTS=$(jq -r '.total.statements.pct' "$SUMMARY_FILE")

echo "📊 Coverage: ${TOTAL_STATEMENTS}%" >&2
if (( $(echo "$TOTAL_STATEMENTS < 80" | bc -l) )); then
  echo "⚠️  Below 80% target - open ${COVERAGE_DIR}/lcov-report/index.html" >&2
fi

exit 0
