#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { DEFAULT_BUNDLE_ID, DEFAULT_DEVICE_NAME, ensureBooted, isAppInstalled, resolveSimulator } from './lib/ios-sim.mjs';

function summarizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}

function safeExec(command, args) {
  try {
    const stdout = execFileSync(command, args, {
      stdio: 'pipe',
      encoding: 'utf8',
    }).trim();

    return { ok: true, stdout, stderr: '' };
  } catch (error) {
    return {
      ok: false,
      stdout: error instanceof Error && 'stdout' in error ? String(error.stdout || '').trim() : '',
      stderr: error instanceof Error && 'stderr' in error ? String(error.stderr || '').trim() : '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function parseCliArgs(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      device: { type: 'string', default: DEFAULT_DEVICE_NAME },
      'bundle-id': { type: 'string', default: DEFAULT_BUNDLE_ID },
      'backend-url': { type: 'string', default: 'http://127.0.0.1:3000/health' },
      json: { type: 'boolean', default: false },
    },
    strict: true,
  });

  return {
    deviceName: values.device,
    bundleId: values['bundle-id'],
    backendUrl: values['backend-url'],
    json: values.json,
  };
}

function deriveMode({ backendOk, appInstalled, simulatorOk }) {
  if (!simulatorOk || !appInstalled) {
    return 'blocked';
  }

  return backendOk ? 'full-runtime' : 'ui-only';
}

export function runPreflight(options = {}) {
  const resolvedOptions = {
    deviceName: options.deviceName ?? DEFAULT_DEVICE_NAME,
    bundleId: options.bundleId ?? DEFAULT_BUNDLE_ID,
    backendUrl: options.backendUrl ?? 'http://127.0.0.1:3000/health',
  };

  const dockerResult = safeExec('docker', ['info']);
  const backendResult = safeExec('curl', ['-sf', resolvedOptions.backendUrl]);
  const javaResult = safeExec('java', ['-version']);

  let iosSimulator;

  try {
    const simulator = resolveSimulator({ deviceName: resolvedOptions.deviceName });
    const bootedSimulator = ensureBooted(simulator.udid);
    const appInstalled = isAppInstalled(bootedSimulator.udid, resolvedOptions.bundleId);

    iosSimulator = {
      ok: true,
      deviceName: bootedSimulator.name,
      udid: bootedSimulator.udid,
      state: bootedSimulator.state,
      appInstalled,
    };
  } catch (error) {
    iosSimulator = {
      ok: false,
      deviceName: resolvedOptions.deviceName,
      udid: null,
      state: null,
      appInstalled: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const recommendedMode = deriveMode({
    backendOk: backendResult.ok,
    appInstalled: iosSimulator.appInstalled,
    simulatorOk: iosSimulator.ok,
  });

  return {
    docker: {
      ok: dockerResult.ok,
      detail: dockerResult.ok ? 'Docker is available.' : summarizeText(dockerResult.stderr || dockerResult.error),
    },
    backend: {
      ok: backendResult.ok,
      url: resolvedOptions.backendUrl,
      detail: backendResult.ok ? 'Backend health check passed.' : summarizeText(backendResult.stderr || backendResult.error),
    },
    java: {
      ok: javaResult.ok,
      detail: javaResult.ok ? 'Java is available.' : summarizeText(javaResult.stderr || javaResult.error),
    },
    iosSimulator,
    readyForRuntimeQa: recommendedMode !== 'blocked',
    recommendedMode,
  };
}

function printHumanReadable(result) {
  const lines = [
    `Recommended mode: ${result.recommendedMode}`,
    `Ready for runtime QA: ${result.readyForRuntimeQa ? 'yes' : 'no'}`,
    `Docker: ${result.docker.ok ? 'ok' : 'failed'}${result.docker.detail ? ` (${result.docker.detail})` : ''}`,
    `Backend: ${result.backend.ok ? 'ok' : 'failed'}${result.backend.detail ? ` (${result.backend.detail})` : ''}`,
    `Java: ${result.java.ok ? 'ok' : 'missing'}${result.java.detail ? ` (${result.java.detail})` : ''}`,
  ];

  if (result.iosSimulator.ok) {
    lines.push(
      `iOS Simulator: ok (${result.iosSimulator.deviceName}, app installed: ${result.iosSimulator.appInstalled ? 'yes' : 'no'})`,
    );
  } else {
    lines.push(`iOS Simulator: failed (${result.iosSimulator.error})`);
  }

  console.log(lines.join('\n'));
}

async function main() {
  const options = parseCliArgs();

  try {
    const result = runPreflight(options);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printHumanReadable(result);
    }

    process.exitCode = result.recommendedMode === 'blocked' ? 1 : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
