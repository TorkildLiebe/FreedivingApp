#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import {
  completeRun,
  ensureNumericIssueNumber,
  isValidCommitSha,
  markIssuesMergedLocal,
  nowIso,
} from './lib/core.mjs';
import {
  readRoadmapIssueMetadata,
  readRunState,
  writeRunStateAndRoadmap,
} from './lib/run-files.mjs';

function readStdout(command, args) {
  return execFileSync(command, args, { encoding: 'utf8' }).trim();
}

function assertCommitExists(commitSha) {
  execFileSync('git', ['cat-file', '-e', `${commitSha}^{commit}`], {
    stdio: 'ignore',
  });
}

function isCommitReachableFrom(commitSha, branch) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', commitSha, branch], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function findLegacyCommitSha(issueNumber) {
  const issue = ensureNumericIssueNumber(issueNumber);
  const byHash = readStdout('git', [
    'log',
    '--all',
    '--format=%H',
    '--extended-regexp',
    '--grep',
    `#${issue}\\b`,
    '-n',
    '1',
  ]);
  if (byHash) {
    return byHash;
  }

  const byIssueWord = readStdout('git', [
    'log',
    '--all',
    '--format=%H',
    '--extended-regexp',
    '--regexp-ignore-case',
    '--grep',
    `issue[[:space:]]*#?${issue}\\b`,
    '-n',
    '1',
  ]);
  return byIssueWord || null;
}

function ensureIssueStatusCloseable(issueNumber, status) {
  if (!['committed', 'merged_local'].includes(status)) {
    throw new Error(
      `Issue #${issueNumber} must be committed or merged_local before milestone close (found: ${status}).`,
    );
  }
}

export function resolveIssueCommitEvidence(state, milestoneBranch) {
  const commitEvidence = {};

  for (const issueNumber of state.issue_order) {
    const key = String(issueNumber);
    const issue = state.issues[key];
    ensureIssueStatusCloseable(issueNumber, issue.status);

    let commitSha = issue.commit_sha ? String(issue.commit_sha).trim() : null;

    if (!commitSha || !isValidCommitSha(commitSha)) {
      commitSha = findLegacyCommitSha(issueNumber);
    }

    if (!commitSha) {
      throw new Error(
        `Issue #${issueNumber} is missing commit evidence (commit_sha and legacy git grep fallback both failed).`,
      );
    }

    try {
      assertCommitExists(commitSha);
    } catch {
      throw new Error(`Issue #${issueNumber} commit does not exist locally: ${commitSha}`);
    }

    if (!isCommitReachableFrom(commitSha, milestoneBranch)) {
      throw new Error(
        `Issue #${issueNumber} commit ${commitSha} is not reachable from branch ${milestoneBranch}.`,
      );
    }

    commitEvidence[key] = commitSha;
  }

  return commitEvidence;
}

export function applyMilestoneClose(state, commitEvidence) {
  const timestamp = nowIso();
  let nextState = state;
  const issuesToMerge = [];

  for (const issueNumber of nextState.issue_order) {
    const key = String(issueNumber);
    const issue = nextState.issues[key];
    const commitSha = commitEvidence[key];
    nextState.issues[key].commit_sha = commitSha;

    if (issue.status === 'committed') {
      issuesToMerge.push(issueNumber);
    }
  }

  if (issuesToMerge.length > 0) {
    nextState = markIssuesMergedLocal(nextState, issuesToMerge, timestamp);
  }

  nextState = completeRun(nextState, timestamp);
  return nextState;
}

export async function runCloseMilestoneRun({ runId, milestoneBranch = null }) {
  const branch =
    milestoneBranch ||
    readStdout('git', ['rev-parse', '--abbrev-ref', 'HEAD']);

  const { paths, state } = await readRunState(runId);
  const issueMetadata = await readRoadmapIssueMetadata(paths.roadmapPath);
  const commitEvidence = resolveIssueCommitEvidence(state, branch);
  const nextState = applyMilestoneClose(state, commitEvidence);

  await writeRunStateAndRoadmap({
    runStatePath: paths.runStatePath,
    roadmapPath: paths.roadmapPath,
    state: nextState,
    issueMetadata,
  });

  console.log(
    `Milestone run ${runId} closed on branch ${branch}. Updated issues: ${state.issue_order.join(', ')}.`,
  );
}

function parseCliArgs(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      'run-id': { type: 'string' },
      'milestone-branch': { type: 'string' },
    },
    strict: true,
  });

  if (!values['run-id']) {
    throw new Error(
      'Usage: node scripts/orchestrator/close-milestone-run.mjs --run-id <id> [--milestone-branch <branch>]',
    );
  }

  return {
    runId: values['run-id'],
    milestoneBranch: values['milestone-branch'] ?? null,
  };
}

async function main() {
  try {
    const args = parseCliArgs(process.argv.slice(2));
    await runCloseMilestoneRun(args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
