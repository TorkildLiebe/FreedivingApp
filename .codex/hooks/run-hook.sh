#!/usr/bin/env zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${(%):-%N}")" && pwd)"

if [[ "${1:-}" == "--" ]]; then
  shift || true
fi
EVENT="${1:-}"
shift || true
if [[ "${1:-}" == "--" ]]; then
  shift || true
fi

if [[ -z "$EVENT" ]]; then
  echo "Usage: $0 <pre-edit|post-edit|pre-commit|post-test> [arg...]" >&2
  exit 1
fi

case "$EVENT" in
  pre-edit)
    if [[ "$#" -eq 0 ]]; then
      echo "pre-edit requires at least one <file_path>" >&2
      exit 1
    fi
    for file_path in "$@"; do
      "${SCRIPT_DIR}/generated-file-guard.sh" "$file_path"
    done
    ;;
  post-edit)
    if [[ "$#" -eq 0 ]]; then
      echo "post-edit requires at least one <file_path>" >&2
      exit 1
    fi
    for file_path in "$@"; do
      "${SCRIPT_DIR}/smart-test-runner.sh" "$file_path"
    done
    ;;
  pre-commit)
    "${SCRIPT_DIR}/commit-quality-gate.sh"
    ;;
  post-test)
    ARG="${*:-}"
    if [[ -z "$ARG" ]]; then
      echo "post-test requires <command_string>" >&2
      exit 1
    fi
    "${SCRIPT_DIR}/coverage-reporter.sh" "$ARG"
    "${SCRIPT_DIR}/output-summarizer.sh" "$ARG"
    ;;
  *)
    echo "Unknown event: $EVENT" >&2
    echo "Supported events: pre-edit, post-edit, pre-commit, post-test" >&2
    exit 1
    ;;
esac

exit 0
