#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import {
  ensureNumericIssueNumber,
  isValidCommitSha,
  markIssueCompleted,
  nextPendingIssue,
  nowIso,
  setCurrentIssue,
  setIssueCommitSha,
} from './lib/core.mjs';
import {
  readRoadmapIssueMetadata,
  readRunState,
  writeRunStateAndRoadmap,
} from './lib/run-files.mjs';

const LEGAL_SOURCE_STATUSES = new Set([
  'planning',
  'implementing',
  'verifying',
  'committed',
]);

function assertCommitExists(commitSha) {
  try {
    execFileSync('git', ['cat-file', '-e', `${commitSha}^{commit}`], {
      stdio: 'ignore',
    });
  } catch {
    throw new Error(`Commit SHA not found: ${commitSha}`);
  }
}

function ensureIssueTransitionAllowed(issueState, issueNumber) {
  if (issueState.status === 'merged_local') {
    throw new Error(
      `Issue #${issueNumber} is already merged_local; cannot transition to committed.`,
    );
  }
  if (issueState.status === 'blocked') {
    throw new Error(`Issue #${issueNumber} is blocked; unblocking is required before commit transition.`);
  }
  if (!LEGAL_SOURCE_STATUSES.has(issueState.status)) {
    throw new Error(
      `Issue #${issueNumber} cannot transition to committed from status "${issueState.status}".`,
    );
  }
}

function normalizeOptionalNote(note) {
  if (note == null) {
    return null;
  }
  const trimmed = String(note).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function applyIssueCommitTransition(state, issueNumber, commitSha, note = null) {
  const normalizedIssue = ensureNumericIssueNumber(issueNumber);
  const normalizedSha = String(commitSha).trim();
  const normalizedNote = normalizeOptionalNote(note);

  if (!isValidCommitSha(normalizedSha)) {
    throw new Error(`Invalid commit SHA format: ${commitSha}`);
  }

  const key = String(normalizedIssue);
  const issueState = state.issues?.[key];
  if (!issueState) {
    throw new Error(`Issue #${normalizedIssue} is not present in run state.`);
  }

  ensureIssueTransitionAllowed(issueState, normalizedIssue);

  const existingSha = issueState.commit_sha ? String(issueState.commit_sha).trim() : null;
  const idempotentCommit =
    issueState.status === 'committed' && existingSha === normalizedSha;
  const idempotentNote =
    normalizedNote == null || issueState.note === normalizedNote;

  if (idempotentCommit && idempotentNote) {
    return state;
  }

  const timestamp = nowIso();
  let nextState = state;

  if (issueState.status !== 'committed') {
    nextState = markIssueCompleted(nextState, normalizedIssue, timestamp, normalizedSha);
  } else {
    nextState = setIssueCommitSha(nextState, normalizedIssue, normalizedSha, timestamp);
    if (!nextState.completed_issues.includes(normalizedIssue)) {
      nextState.completed_issues.push(normalizedIssue);
      nextState.completed_issues.sort((a, b) => a - b);
      if (nextState.current_issue === normalizedIssue) {
        nextState = setCurrentIssue(nextState, nextPendingIssue(nextState), timestamp);
      } else {
        nextState.updated_at = timestamp;
      }
    }
  }

  if (normalizedNote != null) {
    nextState.issues[key].note = normalizedNote;
    nextState.updated_at = timestamp;
  }

  return nextState;
}

export async function runTransitionIssueCommit({
  runId,
  issueNumber,
  commitSha,
  note = null,
}) {
  assertCommitExists(commitSha);

  const { paths, state } = await readRunState(runId);
  const issueMetadata = await readRoadmapIssueMetadata(paths.roadmapPath);
  const updatedState = applyIssueCommitTransition(
    state,
    issueNumber,
    commitSha,
    note,
  );

  await writeRunStateAndRoadmap({
    runStatePath: paths.runStatePath,
    roadmapPath: paths.roadmapPath,
    state: updatedState,
    issueMetadata,
  });

  const issue = ensureNumericIssueNumber(issueNumber);
  console.log(
    `Committed transition recorded for issue #${issue} with commit ${commitSha}.`,
  );
}

function parseCliArgs(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      'run-id': { type: 'string' },
      issue: { type: 'string' },
      'commit-sha': { type: 'string' },
      note: { type: 'string' },
    },
    strict: true,
  });

  if (!values['run-id'] || !values.issue || !values['commit-sha']) {
    throw new Error(
      'Usage: node scripts/orchestrator/transition-issue-commit.mjs --run-id <id> --issue <n> --commit-sha <sha> [--note "..."]',
    );
  }

  return {
    runId: values['run-id'],
    issueNumber: values.issue,
    commitSha: values['commit-sha'],
    note: values.note ?? null,
  };
}

async function main() {
  try {
    const args = parseCliArgs(process.argv.slice(2));
    await runTransitionIssueCommit(args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
