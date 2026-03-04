#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { ensureIosApp } from './ensure-ios-app.mjs';
import { DEFAULT_BUNDLE_ID, DEFAULT_DEVICE_NAME, captureScreenshot } from './lib/ios-sim.mjs';

function parseCliArgs(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      device: { type: 'string', default: DEFAULT_DEVICE_NAME },
      'bundle-id': { type: 'string', default: DEFAULT_BUNDLE_ID },
      'output-dir': { type: 'string' },
      json: { type: 'boolean', default: false },
    },
    strict: true,
  });

  return {
    deviceName: values.device,
    bundleId: values['bundle-id'],
    outputDir: values['output-dir'],
    json: values.json,
  };
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function createRunId(now = new Date()) {
  return [
    'qa-',
    now.getFullYear(),
    '-',
    pad(now.getMonth() + 1),
    '-',
    pad(now.getDate()),
    'T',
    pad(now.getHours()),
    '-',
    pad(now.getMinutes()),
    '-',
    pad(now.getSeconds()),
  ].join('');
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function runSmokeIos(options = {}) {
  const resolvedOptions = {
    deviceName: options.deviceName ?? DEFAULT_DEVICE_NAME,
    bundleId: options.bundleId ?? DEFAULT_BUNDLE_ID,
    outputDir: options.outputDir,
  };
  const runId = createRunId();
  const ensureResult = ensureIosApp(resolvedOptions);
  const outputDir = resolvedOptions.outputDir ?? path.join('docs', 'qa', 'evidence', runId);
  const evidencePath = path.join(outputDir, 'ios-smoke-launch.png');

  await mkdir(outputDir, { recursive: true });
  await sleep(5000);
  await captureScreenshot(ensureResult.simulator.udid, evidencePath);

  return {
    runId,
    simulator: ensureResult.simulator,
    bundleId: ensureResult.bundleId,
    buildRequired: ensureResult.buildRequired,
    launched: ensureResult.launched,
    evidencePath,
  };
}

function printHumanReadable(result) {
  console.log(
    [
      `Run ID: ${result.runId}`,
      `Simulator: ${result.simulator.name}`,
      `Bundle ID: ${result.bundleId}`,
      `Build required: ${result.buildRequired ? 'yes' : 'no'}`,
      `Launch succeeded: ${result.launched ? 'yes' : 'no'}`,
      `Evidence: ${result.evidencePath}`,
    ].join('\n'),
  );
}

async function main() {
  const options = parseCliArgs();

  try {
    const result = await runSmokeIos(options);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printHumanReadable(result);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
