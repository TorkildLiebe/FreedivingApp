import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createRunState,
  markIssueCompleted,
  setIssueStatus,
} from '../lib/core.mjs';
import { applyIssueCommitTransition } from '../transition-issue-commit.mjs';
import { applyMilestoneClose } from '../close-milestone-run.mjs';
import { parseRoadmapIssueMetadata } from '../lib/run-files.mjs';

test('applyIssueCommitTransition marks issue committed with commit_sha', () => {
  let state = createRunState({
    runId: 'run-commit',
    milestone: 'M2',
    issueOrder: [73, 74],
    startedAt: '2026-02-24T12:00:00.000Z',
  });
  state = setIssueStatus(state, 73, 'verifying', '2026-02-24T12:01:00.000Z');

  const nextState = applyIssueCommitTransition(
    state,
    73,
    'abcdef1234567890',
    'Ready for milestone merge.',
  );

  assert.equal(nextState.issues['73'].status, 'committed');
  assert.equal(nextState.issues['73'].commit_sha, 'abcdef1234567890');
  assert.equal(nextState.issues['73'].note, 'Ready for milestone merge.');
  assert.deepEqual(nextState.completed_issues, [73]);
});

test('applyIssueCommitTransition is idempotent for same issue+sha', () => {
  let state = createRunState({
    runId: 'run-commit-idempotent',
    milestone: 'M2',
    issueOrder: [73],
    startedAt: '2026-02-24T12:00:00.000Z',
  });
  state = setIssueStatus(state, 73, 'verifying', '2026-02-24T12:01:00.000Z');
  state = applyIssueCommitTransition(state, 73, 'abcdef1234567890', 'done');

  const replayState = applyIssueCommitTransition(
    state,
    73,
    'abcdef1234567890',
    'done',
  );
  assert.deepEqual(replayState, state);
});

test('applyIssueCommitTransition rejects invalid sha', () => {
  const state = createRunState({
    runId: 'run-invalid-sha',
    milestone: 'M2',
    issueOrder: [73],
  });

  assert.throws(
    () => applyIssueCommitTransition(state, 73, 'bad-sha', null),
    /Invalid commit SHA format/,
  );
});

test('applyMilestoneClose transitions committed issues and completes run', () => {
  let state = createRunState({
    runId: 'run-close',
    milestone: 'M2',
    issueOrder: [73, 74],
    startedAt: '2026-02-24T12:00:00.000Z',
  });

  state = markIssueCompleted(
    setIssueStatus(state, 73, 'verifying', '2026-02-24T12:01:00.000Z'),
    73,
    '2026-02-24T12:02:00.000Z',
    'abcdef1234567890',
  );
  state = markIssueCompleted(
    setIssueStatus(state, 74, 'verifying', '2026-02-24T12:03:00.000Z'),
    74,
    '2026-02-24T12:04:00.000Z',
    '1234567890abcdef',
  );

  const closed = applyMilestoneClose(state, {
    '73': 'abcdef1234567890',
    '74': '1234567890abcdef',
  });

  assert.equal(closed.status, 'completed');
  assert.equal(closed.current_issue, null);
  assert.equal(closed.issues['73'].status, 'merged_local');
  assert.equal(closed.issues['74'].status, 'merged_local');
});

test('parseRoadmapIssueMetadata reads issue titles from roadmap table', () => {
  const markdown = `
| Issue | Title | Status | Attempts | Note |
| --- | --- | --- | --- | --- |
| #73 | Marker clustering | committed | 1 |  |
| #74 | Spot detail sheet | verifying | 2 | retrying |
`;

  const metadata = parseRoadmapIssueMetadata(markdown);
  assert.equal(metadata['73'].title, 'Marker clustering');
  assert.equal(metadata['74'].note, 'retrying');
});
