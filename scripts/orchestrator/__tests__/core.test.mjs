import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canRetryIssue,
  completeRun,
  createRunState,
  hasVerificationFailure,
  isMobileUiImpacting,
  markIssueBlocked,
  markIssueCompleted,
  markIssuesMergedLocal,
  nextPendingIssue,
  parseWorkerReport,
  parseWorkerTrailer,
  renderRoadmapMarkdown,
  recordIssueAttempt,
  setIssueStatus,
  validateWorkerReportContract,
  validateWorkerTrailer,
} from '../lib/core.mjs';

test('parses worker report contract and trailer block', () => {
  const markdown = `## Changes made
Updated feature.

## Verification run
All passed.

## Not run / limitations
Android simulator not run.

## Risk notes
Residual Android verification risk.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 120`;

  const sections = parseWorkerReport(markdown);
  const trailer = validateWorkerTrailer(parseWorkerTrailer(markdown), 120);

  assert.equal(sections['Changes made'], 'Updated feature.');
  assert.equal(sections['Verification run'], 'All passed.');
  assert.equal(trailer.RESULT, 'PASS');
  assert.equal(trailer.MOBILE_UI_TOUCHED, true);
});

test('worker report parser fails when a required heading is missing', () => {
  const markdown = `## Changes made
Updated feature.

## Verification run
All passed.

## Risk notes
Low`;

  assert.throws(() => parseWorkerReport(markdown), /Missing report sections/);
});

test('trailer validation fails on missing keys and invalid values', () => {
  assert.throws(
    () => validateWorkerTrailer({ RESULT: 'PASS', VERIFICATION: 'PASS' }),
    /Missing trailer field/,
  );

  assert.throws(
    () =>
      validateWorkerTrailer({
        RESULT: 'MAYBE',
        VERIFICATION: 'PASS',
        MOBILE_UI_TOUCHED: 'true',
        IOS_VERIFIED: 'true',
        ISSUE_NUMBER: '1',
      }),
    /Invalid trailer RESULT value/,
  );
});

test('run state handles happy path transitions for two issues', () => {
  const start = '2026-02-24T12:00:00.000Z';
  let state = createRunState({ runId: '20260224-120000', milestone: 'M2', issueOrder: [101, 102], startedAt: start });

  state = setIssueStatus(state, 101, 'planning', '2026-02-24T12:01:00.000Z');
  state = setIssueStatus(state, 101, 'implementing', '2026-02-24T12:02:00.000Z');
  state = setIssueStatus(state, 101, 'verifying', '2026-02-24T12:03:00.000Z');
  state = markIssueCompleted(state, 101, '2026-02-24T12:05:00.000Z');

  state = setIssueStatus(state, 102, 'planning', '2026-02-24T12:06:00.000Z');
  state = setIssueStatus(state, 102, 'implementing', '2026-02-24T12:07:00.000Z');
  state = setIssueStatus(state, 102, 'verifying', '2026-02-24T12:08:00.000Z');
  state = markIssueCompleted(state, 102, '2026-02-24T12:09:00.000Z');

  state = markIssuesMergedLocal(state, [101, 102], '2026-02-24T12:10:00.000Z');
  state = completeRun(state, '2026-02-24T12:11:00.000Z');

  assert.equal(state.status, 'completed');
  assert.deepEqual(state.completed_issues, [101, 102]);
  assert.equal(state.current_issue, null);
  assert.equal(state.issues['101'].status, 'merged_local');
  assert.equal(state.issues['102'].status, 'merged_local');
});

test('retry budget tracks attempts and blocks after retry cap', () => {
  let state = createRunState({ runId: '20260224-120000', milestone: 'M2', issueOrder: [210] });

  state = recordIssueAttempt(state, 210);
  assert.equal(canRetryIssue(state, 210, 2), true);

  state = recordIssueAttempt(state, 210);
  assert.equal(canRetryIssue(state, 210, 2), true);

  state = recordIssueAttempt(state, 210);
  assert.equal(canRetryIssue(state, 210, 2), false);

  state = markIssueBlocked(state, 210, 'Verification failed after retries.');
  assert.equal(state.status, 'blocked');
  assert.equal(state.blocked_issue, 210);
});

test('resume logic returns first non-completed issue', () => {
  let state = createRunState({ runId: 'run-1', milestone: 'M3', issueOrder: [1, 2, 3] });
  state = markIssueCompleted(state, 1);
  state = markIssueCompleted(state, 2);

  assert.equal(nextPendingIssue(state), 3);
  assert.equal(state.current_issue, 3);
});

test('mobile UI impact detector follows path and slice rules', () => {
  assert.equal(
    isMobileUiImpacting({
      affectedSlices: ['backend'],
      touchedFiles: ['apps/backend/src/modules/spots/spots.service.ts'],
    }),
    false,
  );

  assert.equal(
    isMobileUiImpacting({
      affectedSlices: ['mobile'],
      touchedFiles: [],
    }),
    true,
  );

  assert.equal(
    isMobileUiImpacting({
      affectedSlices: [],
      touchedFiles: ['apps/mobile/src/features/map/screens/MapScreen.tsx'],
    }),
    true,
  );
});

test('roadmap markdown renders deterministic table output', () => {
  let state = createRunState({ runId: 'run-table', milestone: 'M2', issueOrder: [5] });
  state = setIssueStatus(state, 5, 'planning', '2026-02-24T12:02:00.000Z');

  const markdown = renderRoadmapMarkdown(state, {
    5: { title: 'Map marker clustering' },
  });

  assert.match(markdown, /# Run Roadmap run-table/);
  assert.match(markdown, /\| #5 \| Map marker clustering \| planning \| 0 \|  \|/);
});

test('verification failure helper uses text and trailer data', () => {
  assert.equal(hasVerificationFailure('pnpm test failed'), true);
  assert.equal(hasVerificationFailure('All passed', { VERIFICATION: 'PASS' }), false);
  assert.equal(hasVerificationFailure('All passed', { VERIFICATION: 'FAIL' }), true);
});

test('worker report contract validator passes for valid mobile UI report', () => {
  const markdown = `## Changes made
Updated map UI and detail sheet.
Design OS assets used: docs/design-os-plan/product-overview.md
Component mapping: MarkerChip -> apps/mobile/src/features/map/components/MarkerChip.tsx

## Verification run
All passed on iOS runtime.
Design parity evidence: docs/orchestration/runs/screenshots/issue-900/ios-map-screen.png

## Not run / limitations
Android runtime verification not run in this environment.

## Risk notes
Approved deviations: none.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 900`;

  const { trailer } = validateWorkerReportContract(markdown, {
    expectedIssueNumber: 900,
  });
  assert.equal(trailer.RESULT, 'PASS');
  assert.equal(trailer.MOBILE_UI_TOUCHED, true);
});

test('worker report contract validator rejects mobile UI report without iOS verification', () => {
  const markdown = `## Changes made
Updated UI.
Design OS assets used: docs/design-os-plan/product-overview.md
Component mapping: A -> B

## Verification run
Passed tests.
Design parity evidence: screenshot.png

## Not run / limitations
None.

## Risk notes
Approved deviations: none.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: false
ISSUE_NUMBER: 901`;

  assert.throws(
    () => validateWorkerReportContract(markdown, { expectedIssueNumber: 901 }),
    /Mobile UI reports must set IOS_VERIFIED: true/,
  );
});

test('worker report contract validator rejects missing UI evidence labels', () => {
  const markdown = `## Changes made
Updated UI.

## Verification run
Passed tests.

## Not run / limitations
Android not run.

## Risk notes
Residual risk documented.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 902`;

  assert.throws(
    () => validateWorkerReportContract(markdown, { expectedIssueNumber: 902 }),
    /Missing required UI evidence labels/,
  );
});

test('worker report contract validator rejects PASS result when verification fails', () => {
  const markdown = `## Changes made
Backend only changes.

## Verification run
Failed lint.

## Not run / limitations
None.

## Risk notes
Residual risk documented.

RESULT: PASS
VERIFICATION: FAIL
MOBILE_UI_TOUCHED: false
IOS_VERIFIED: false
ISSUE_NUMBER: 903`;

  assert.throws(
    () => validateWorkerReportContract(markdown, { expectedIssueNumber: 903 }),
    /RESULT cannot be PASS when VERIFICATION is FAIL/,
  );
});

test('worker report contract validator rejects non-mobile report with IOS_VERIFIED true', () => {
  const markdown = `## Changes made
Backend only changes.

## Verification run
All passed.

## Not run / limitations
None.

## Risk notes
Residual risk documented.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: false
IOS_VERIFIED: true
ISSUE_NUMBER: 904`;

  assert.throws(
    () => validateWorkerReportContract(markdown, { expectedIssueNumber: 904 }),
    /Non-mobile reports must set IOS_VERIFIED: false/,
  );
});
