import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createIssueRunState,
  ensureNumericIssueNumber,
  hasVerificationFailure,
  parseWorkerReport,
  validateImplementationWorker,
} from '../lib/core.mjs';

test('validates implementation worker as agent vertical-slice-implementor', () => {
  const worker = validateImplementationWorker({
    implementationWorker: {
      type: 'agent',
      name: 'vertical-slice-implementor',
    },
  });

  assert.equal(worker.type, 'agent');
  assert.equal(worker.name, 'vertical-slice-implementor');
});

test('rejects non-agent worker configuration', () => {
  assert.throws(() => {
    validateImplementationWorker({
      implementationWorker: {
        type: 'skill',
        name: 'vertical-slice-implementor',
      },
    });
  });
});

test('parses worker report with required four sections', () => {
  const markdown = `## Changes made\nA\n\n## Verification run\nAll passed\n\n## Not run / limitations\nNone\n\n## Risk notes\nLow`;
  const report = parseWorkerReport(markdown);

  assert.equal(report['Changes made'], 'A');
  assert.equal(report['Verification run'], 'All passed');
  assert.equal(report['Not run / limitations'], 'None');
  assert.equal(report['Risk notes'], 'Low');
});

test('fails report parsing when a required section is missing', () => {
  const markdown = `## Changes made\nA\n\n## Verification run\nAll passed\n\n## Risk notes\nLow`;

  assert.throws(() => parseWorkerReport(markdown), /Missing report sections/);
});

test('detects verification failures from worker output', () => {
  assert.equal(hasVerificationFailure('pnpm test:backend failed with exit 1'), true);
  assert.equal(hasVerificationFailure('All passed across targeted checks.'), false);
});

test('issue number input must be numeric', () => {
  assert.equal(ensureNumericIssueNumber('42'), 42);
  assert.throws(() => ensureNumericIssueNumber('abc'), /must be numeric/);
});

test('issue run state includes required agent lifecycle fields', () => {
  const state = createIssueRunState(
    {
      issueNumber: 101,
      title: 'Example',
      url: 'https://github.com/example/repo/issues/101',
      itemId: 'ITEM_1',
    },
    'codex/issue/101-example',
  );

  assert.equal(state.agent_started_at, null);
  assert.equal(state.agent_finished_at, null);
  assert.equal(state.agent_result, null);
  assert.equal(state.agent_blocker, null);
});
