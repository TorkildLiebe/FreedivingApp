#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_DEVICE_NAME = 'iPhone 17';
export const DEFAULT_BUNDLE_ID = 'com.anonymous.mobile';

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    stdio: 'pipe',
    encoding: 'utf8',
    ...options,
  }).trim();
}

function tryRun(command, args, options = {}) {
  try {
    const stdout = execFileSync(command, args, {
      stdio: 'pipe',
      encoding: 'utf8',
      ...options,
    }).trim();
    return { ok: true, stdout };
  } catch (error) {
    const stderr = error instanceof Error && 'stderr' in error ? String(error.stderr || '').trim() : '';
    const stdout = error instanceof Error && 'stdout' in error ? String(error.stdout || '').trim() : '';

    return {
      ok: false,
      stdout,
      stderr,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

function listSimulators() {
  const raw = run('xcrun', ['simctl', 'list', 'devices', '--json']);
  const parsed = JSON.parse(raw);

  return Object.values(parsed.devices || {})
    .flatMap((devices) => devices)
    .filter((device) => device?.isAvailable);
}

function findDeviceByUdid(udid) {
  return listSimulators().find((device) => device.udid === udid) ?? null;
}

export function resolveSimulator({ deviceName = DEFAULT_DEVICE_NAME } = {}) {
  const devices = listSimulators().filter((device) => String(device.name).includes('iPhone'));
  if (devices.length === 0) {
    throw new Error('No available iPhone simulator found.');
  }

  const bootedDevice = devices.find((device) => device.state === 'Booted');
  if (bootedDevice) {
    return bootedDevice;
  }

  const preferredDevice = devices.find((device) => device.name === deviceName);
  if (preferredDevice) {
    return preferredDevice;
  }

  return devices[0];
}

export function ensureBooted(udid) {
  const device = findDeviceByUdid(udid);
  if (!device) {
    throw new Error(`Simulator ${udid} was not found.`);
  }

  if (device.state !== 'Booted') {
    execFileSync('xcrun', ['simctl', 'boot', udid], { stdio: 'inherit' });
  }

  run('xcrun', ['simctl', 'bootstatus', udid, '-b']);
  execFileSync('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', udid], { stdio: 'inherit' });

  return findDeviceByUdid(udid) ?? device;
}

export function isAppInstalled(udid, bundleId = DEFAULT_BUNDLE_ID) {
  const result = tryRun('xcrun', ['simctl', 'get_app_container', udid, bundleId, 'app']);
  return result.ok;
}

export function launchApp(udid, bundleId = DEFAULT_BUNDLE_ID) {
  const raw = run('xcrun', ['simctl', 'launch', udid, bundleId]);
  const pidMatch = raw.match(/:\s*(\d+)\s*$/);

  return {
    raw,
    pid: pidMatch ? Number(pidMatch[1]) : null,
  };
}

export async function captureScreenshot(udid, outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  run('xcrun', ['simctl', 'io', udid, 'screenshot', outputPath]);
  return outputPath;
}
