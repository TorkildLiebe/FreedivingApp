import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parseApiTarget, runMobileRuntimeReady } from '../mobile-runtime-ready.mjs';

async function createTempEnvFiles({ mobileEnv, backendEnv }) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'runtime-ready-'));
  const mobileEnvPath = path.join(tempDir, 'mobile.env');
  const backendEnvPath = path.join(tempDir, 'backend.env');

  await writeFile(mobileEnvPath, mobileEnv, 'utf8');
  await writeFile(backendEnvPath, backendEnv, 'utf8');

  return {
    tempDir,
    mobileEnvPath,
    backendEnvPath,
  };
}

test('parseApiTarget validates malformed API URLs', () => {
  const parsed = parseApiTarget('not-a-valid-url');
  assert.equal(parsed.ok, false);
  assert.match(parsed.reason, /not a valid URL/);
});

test('runMobileRuntimeReady fails on API/backend port mismatch', async () => {
  const temp = await createTempEnvFiles({
    mobileEnv: 'EXPO_PUBLIC_API_URL="http://127.0.0.1:3100"\n',
    backendEnv: 'PORT="3000"\n',
  });

  try {
    await assert.rejects(
      () =>
        runMobileRuntimeReady({
          mobileEnvPath: temp.mobileEnvPath,
          backendEnvPath: temp.backendEnvPath,
          fetchImpl: async () => ({ ok: true, status: 200 }),
          runAuthCheck: async () => ({}),
          portProbe: async () => ({ ok: true }),
          socketLister: () => ['node 12345 LISTEN'],
          logger: () => {},
        }),
      /Align EXPO_PUBLIC_API_URL port/,
    );
  } finally {
    await rm(temp.tempDir, { recursive: true, force: true });
  }
});

test('runMobileRuntimeReady fails when /health is unreachable', async () => {
  const temp = await createTempEnvFiles({
    mobileEnv: 'EXPO_PUBLIC_API_URL="http://127.0.0.1:3100"\n',
    backendEnv: 'PORT="3100"\n',
  });

  try {
    await assert.rejects(
      () =>
        runMobileRuntimeReady({
          mobileEnvPath: temp.mobileEnvPath,
          backendEnvPath: temp.backendEnvPath,
          fetchImpl: async () => ({ ok: false, status: 503 }),
          runAuthCheck: async () => ({}),
          portProbe: async () => ({ ok: true }),
          socketLister: () => ['node 12345 LISTEN'],
          logger: () => {},
        }),
      /Ensure backend \/health is reachable/,
    );
  } finally {
    await rm(temp.tempDir, { recursive: true, force: true });
  }
});

test('runMobileRuntimeReady passes when parity, listen probe, health, and auth are all healthy', async () => {
  const temp = await createTempEnvFiles({
    mobileEnv: 'EXPO_PUBLIC_API_URL="http://127.0.0.1:3100"\n',
    backendEnv: 'PORT="3100"\n',
  });

  try {
    const result = await runMobileRuntimeReady({
      mobileEnvPath: temp.mobileEnvPath,
      backendEnvPath: temp.backendEnvPath,
      fetchImpl: async () => ({ ok: true, status: 200 }),
      runAuthCheck: async () => ({}),
      portProbe: async () => ({ ok: true }),
      socketLister: () => ['node 12345 LISTEN'],
      logger: () => {},
    });

    assert.equal(result.backendPort, 3100);
    assert.equal(result.healthUrl, 'http://127.0.0.1:3100/health');
  } finally {
    await rm(temp.tempDir, { recursive: true, force: true });
  }
});
