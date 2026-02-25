import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';

import { runValidateWorkerReport } from '../validate-worker-report.mjs';

test('runValidateWorkerReport passes for valid mobile UI report file', async () => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'worker-report-valid-'));
  const reportPath = path.join(tmpDir, 'report.md');

  try {
    await writeFile(
      reportPath,
      `## Changes made
Updated UI flow.
Design OS assets used: docs/design-os-plan/product-overview.md
Component mapping: MapView -> apps/mobile/src/features/map/components/MapView.native.tsx

## Verification run
All passed on iOS runtime.
Design parity evidence: docs/orchestration/runs/screenshots/issue-1000/ios-map-screen.png

## Not run / limitations
Android runtime not run.

## Risk notes
Approved deviations: none.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 1000\n`,
      'utf8',
    );

    const trailer = await runValidateWorkerReport({ reportPath, issueNumber: 1000 });
    assert.equal(trailer.ISSUE_NUMBER, 1000);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
});

test('runValidateWorkerReport fails for invalid historical UI report', async () => {
  await assert.rejects(
    () =>
      runValidateWorkerReport({
        reportPath: 'docs/orchestration/runs/20260224-203327-m2/issues/77-report.md',
        issueNumber: 77,
      }),
    /Worker report contract validation failed/,
  );
});
