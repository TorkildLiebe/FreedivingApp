#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import {
  DEFAULT_BUNDLE_ID,
  DEFAULT_DEVICE_NAME,
  ensureBooted,
  isAppInstalled,
  launchApp,
  resolveSimulator,
} from './lib/ios-sim.mjs';

function parseCliArgs(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      device: { type: 'string', default: DEFAULT_DEVICE_NAME },
      'bundle-id': { type: 'string', default: DEFAULT_BUNDLE_ID },
      json: { type: 'boolean', default: false },
    },
    strict: true,
  });

  return {
    deviceName: values.device,
    bundleId: values['bundle-id'],
    json: values.json,
  };
}

function buildIosApp(deviceName) {
  execFileSync('pnpm', ['--filter', 'mobile', 'exec', 'expo', 'run:ios', '--device', deviceName], {
    stdio: 'inherit',
  });
}

export function ensureIosApp(options = {}) {
  const resolvedOptions = {
    deviceName: options.deviceName ?? DEFAULT_DEVICE_NAME,
    bundleId: options.bundleId ?? DEFAULT_BUNDLE_ID,
  };

  const simulator = resolveSimulator({ deviceName: resolvedOptions.deviceName });
  const bootedSimulator = ensureBooted(simulator.udid);

  let buildRequired = false;
  let installed = isAppInstalled(bootedSimulator.udid, resolvedOptions.bundleId);

  if (!installed) {
    buildIosApp(bootedSimulator.name);
    buildRequired = true;
    installed = isAppInstalled(bootedSimulator.udid, resolvedOptions.bundleId);
  }

  if (!installed) {
    throw new Error(`App ${resolvedOptions.bundleId} is still not installed after expo run:ios.`);
  }

  const launch = launchApp(bootedSimulator.udid, resolvedOptions.bundleId);

  return {
    simulator: {
      name: bootedSimulator.name,
      udid: bootedSimulator.udid,
    },
    bundleId: resolvedOptions.bundleId,
    buildRequired,
    launched: true,
    launchOutput: launch.raw,
    pid: launch.pid,
  };
}

function printHumanReadable(result) {
  console.log(
    [
      `Simulator: ${result.simulator.name}`,
      `Bundle ID: ${result.bundleId}`,
      `Build required: ${result.buildRequired ? 'yes' : 'no'}`,
      `Launch succeeded: ${result.launched ? 'yes' : 'no'}`,
      `Launch output: ${result.launchOutput}`,
    ].join('\n'),
  );
}

async function main() {
  const options = parseCliArgs();

  try {
    const result = ensureIosApp(options);

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
