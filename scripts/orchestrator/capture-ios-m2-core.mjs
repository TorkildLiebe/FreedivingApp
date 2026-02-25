#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { loadMobileEnv, validateMobileAuthEnv, verifySupabasePasswordAuth } from './lib/mobile-auth.mjs';

const MOBILE_ENV_PATH = path.join('apps', 'mobile', '.env');
const DEFAULT_DEVICE_NAME = 'iPhone 17';
const DEFAULT_CENTER = {
  lat: 59.9139,
  lon: 10.7522,
};

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    stdio: 'pipe',
    encoding: 'utf8',
    ...options,
  }).trim();
}

function runInherit(command, args, options = {}) {
  execFileSync(command, args, {
    stdio: 'inherit',
    ...options,
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseSimulatorsJson() {
  const raw = run('xcrun', ['simctl', 'list', 'devices', '--json']);
  return JSON.parse(raw);
}

function flattenSimulators(simulatorsByRuntime) {
  return Object.values(simulatorsByRuntime).flatMap((devices) => devices);
}

function resolveDevice(simctlJson, preferredName) {
  const all = flattenSimulators(simctlJson.devices || {});
  const booted = all.find((device) => device.state === 'Booted' && (!preferredName || device.name === preferredName));
  if (booted) {
    return booted;
  }

  const availableByName = all.find(
    (device) => device.isAvailable && (!preferredName || device.name === preferredName),
  );
  if (availableByName) {
    return availableByName;
  }

  const fallback = all.find((device) => device.isAvailable && String(device.name).includes('iPhone'));
  if (fallback) {
    return fallback;
  }

  throw new Error('No available iOS simulator found.');
}

function ensureBootedSimulator(device) {
  if (device.state !== 'Booted') {
    runInherit('xcrun', ['simctl', 'boot', device.udid]);
  }
  runInherit('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', device.udid]);
}

async function readEnvFile() {
  try {
    return await readFile(MOBILE_ENV_PATH, 'utf8');
  } catch {
    return '';
  }
}

function upsertEnvContent(original, overrides) {
  const lines = original.split('\n');
  const next = [];
  const keys = new Set(Object.keys(overrides));

  for (const line of lines) {
    const trimmed = line.trim();
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex <= 0) {
      next.push(line);
      continue;
    }
    const key = trimmed.slice(0, equalsIndex).trim();
    if (!keys.has(key)) {
      next.push(line);
    }
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value == null || String(value).length === 0) {
      continue;
    }
    next.push(`${key}="${String(value).replaceAll('"', '\\"')}"`);
  }

  return `${next.join('\n').trim()}\n`;
}

async function withMobileEnvOverrides(overrides, callback) {
  const original = await readEnvFile();
  const next = upsertEnvContent(original, overrides);

  await writeFile(MOBILE_ENV_PATH, next, 'utf8');
  try {
    await callback();
  } finally {
    await writeFile(MOBILE_ENV_PATH, original, 'utf8');
  }
}

async function ensureDeterministicSpot({
  apiUrl,
  authToken,
  devUserId,
}) {
  const baseUrl = String(apiUrl).replace(/\/+$/, '');
  const headers = {
    'content-type': 'application/json',
    authorization: `Bearer ${authToken}`,
    'x-dev-user-id': devUserId,
  };

  const listParams = new URLSearchParams({
    latMin: String(DEFAULT_CENTER.lat - 0.2),
    latMax: String(DEFAULT_CENTER.lat + 0.2),
    lonMin: String(DEFAULT_CENTER.lon - 0.2),
    lonMax: String(DEFAULT_CENTER.lon + 0.2),
  });

  const listResponse = await fetch(`${baseUrl}/spots?${listParams.toString()}`, {
    method: 'GET',
    headers,
  });
  if (!listResponse.ok) {
    throw new Error(`Failed to list spots for deterministic selection (HTTP ${listResponse.status}).`);
  }

  const listPayload = await listResponse.json();
  const existingSpot = listPayload?.items?.[0];
  if (existingSpot?.id) {
    return existingSpot;
  }

  const createResponse = await fetch(`${baseUrl}/spots`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Automation Spot M2',
      centerLat: DEFAULT_CENTER.lat,
      centerLon: DEFAULT_CENTER.lon,
      description: 'Deterministic automation spot.',
      accessInfo: 'Automation-only seeded entry.',
    }),
  });
  if (!createResponse.ok) {
    throw new Error(`Failed to seed deterministic spot (HTTP ${createResponse.status}).`);
  }

  return createResponse.json();
}

async function captureStateScreenshot({
  deviceName,
  udid,
  screenshotPath,
  envOverrides,
}) {
  await withMobileEnvOverrides(envOverrides, async () => {
    runInherit('pnpm', ['--filter', 'mobile', 'exec', 'expo', 'run:ios', '--device', deviceName]);
    await sleep(5000);
    runInherit('xcrun', ['simctl', 'io', udid, 'screenshot', screenshotPath]);
  });
}

export async function runCaptureIosM2Core({ runId, issueNumber, deviceName = DEFAULT_DEVICE_NAME }) {
  const env = await loadMobileEnv();
  const validation = validateMobileAuthEnv(env);
  if (!validation.ok) {
    throw new Error(
      `Mobile auth preflight failed. Missing: ${validation.missing.join(', ')}`,
    );
  }

  const { accessToken } = await verifySupabasePasswordAuth(env);
  const apiUrl = env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is required for deterministic spot fetch/seed.');
  }

  const simctlJson = parseSimulatorsJson();
  const device = resolveDevice(simctlJson, deviceName);
  ensureBootedSimulator(device);

  const seededSpot = await ensureDeterministicSpot({
    apiUrl,
    authToken: accessToken,
    devUserId: env.EXPO_PUBLIC_DEV_USER_ID,
  });
  const selectedSpotId = seededSpot.id;

  const screenshotDir = path.join(
    'docs',
    'orchestration',
    'runs',
    'screenshots',
    `issue-${ensureNumericIssue(issueNumber)}`,
  );
  await mkdir(screenshotDir, { recursive: true });

  const baseOverrides = {
    EXPO_PUBLIC_DEV_USER_ID: env.EXPO_PUBLIC_DEV_USER_ID,
    EXPO_PUBLIC_AUTO_LOGIN_EMAIL: env.EXPO_PUBLIC_AUTO_LOGIN_EMAIL,
    EXPO_PUBLIC_AUTO_LOGIN_PASSWORD: env.EXPO_PUBLIC_AUTO_LOGIN_PASSWORD,
    EXPO_PUBLIC_DEV_CREATE_LAT: String(
      seededSpot.centerLat ?? DEFAULT_CENTER.lat,
    ),
    EXPO_PUBLIC_DEV_CREATE_LON: String(
      seededSpot.centerLon ?? DEFAULT_CENTER.lon,
    ),
  };

  await captureStateScreenshot({
    deviceName: device.name,
    udid: device.udid,
    screenshotPath: path.join(screenshotDir, 'ios-map-screen.png'),
    envOverrides: {
      ...baseOverrides,
      EXPO_PUBLIC_DEV_CREATE_STEP: '',
      EXPO_PUBLIC_DEV_SELECTED_SPOT_ID: '',
    },
  });

  await captureStateScreenshot({
    deviceName: device.name,
    udid: device.udid,
    screenshotPath: path.join(screenshotDir, 'ios-spot-detail-sheet-open.png'),
    envOverrides: {
      ...baseOverrides,
      EXPO_PUBLIC_DEV_CREATE_STEP: '',
      EXPO_PUBLIC_DEV_SELECTED_SPOT_ID: selectedSpotId,
    },
  });

  await captureStateScreenshot({
    deviceName: device.name,
    udid: device.udid,
    screenshotPath: path.join(screenshotDir, 'ios-create-spot-placement-step.png'),
    envOverrides: {
      ...baseOverrides,
      EXPO_PUBLIC_DEV_SELECTED_SPOT_ID: '',
      EXPO_PUBLIC_DEV_CREATE_STEP: 'placing',
    },
  });

  await captureStateScreenshot({
    deviceName: device.name,
    udid: device.udid,
    screenshotPath: path.join(screenshotDir, 'ios-create-spot-form-step.png'),
    envOverrides: {
      ...baseOverrides,
      EXPO_PUBLIC_DEV_SELECTED_SPOT_ID: '',
      EXPO_PUBLIC_DEV_CREATE_STEP: 'form',
    },
  });

  console.log(`Captured M2 core iOS screenshots for run ${runId}, issue ${issueNumber}.`);
  console.log(`Output: ${screenshotDir}`);
}

function ensureNumericIssue(value) {
  if (!/^\d+$/.test(String(value).trim())) {
    throw new Error(`Issue number must be numeric. Received: ${value}`);
  }
  return Number(value);
}

function parseCliArgs(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      'run-id': { type: 'string' },
      'issue-number': { type: 'string' },
      device: { type: 'string' },
    },
    strict: true,
  });

  if (!values['run-id'] || !values['issue-number']) {
    throw new Error(
      'Usage: node scripts/orchestrator/capture-ios-m2-core.mjs --run-id <id> --issue-number <n> [--device "<name>"]',
    );
  }

  return {
    runId: values['run-id'],
    issueNumber: values['issue-number'],
    deviceName: values.device ?? DEFAULT_DEVICE_NAME,
  };
}

async function main() {
  try {
    const args = parseCliArgs(process.argv.slice(2));
    await runCaptureIosM2Core(args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
