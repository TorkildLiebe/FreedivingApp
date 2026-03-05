#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import net from 'node:net';
import { runMobileAuthCheck } from './check-mobile-auth.mjs';

const MOBILE_ENV_PATH = 'apps/mobile/.env';
const BACKEND_ENV_PATH = 'apps/backend/.env';
const DEFAULT_BACKEND_PORT = 3000;
const DEFAULT_TIMEOUT_MS = 3000;

export function parseDotEnv(content) {
  const values = {};
  const lines = String(content ?? '').split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, equalIndex).trim();
    let value = trimmed.slice(equalIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

async function loadEnvFile(filePath) {
  try {
    return parseDotEnv(await readFile(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function parsePositivePort(value, fallback = null) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return fallback;
  }
  return parsed;
}

export function parseApiTarget(apiUrlRaw) {
  const apiUrl = String(apiUrlRaw ?? '').trim();
  if (!apiUrl) {
    return {
      ok: false,
      reason: 'EXPO_PUBLIC_API_URL is missing in apps/mobile/.env (or shell env).',
    };
  }

  let url;
  try {
    url = new URL(apiUrl);
  } catch {
    return {
      ok: false,
      reason: `EXPO_PUBLIC_API_URL is not a valid URL: ${apiUrl}`,
    };
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return {
      ok: false,
      reason: `EXPO_PUBLIC_API_URL must use http or https. Received protocol: ${url.protocol}`,
    };
  }

  const port = parsePositivePort(
    url.port,
    url.protocol === 'https:' ? 443 : 80,
  );

  return {
    ok: true,
    url,
    host: url.hostname,
    origin: url.origin,
    port,
  };
}

function isLocalHost(host) {
  return ['127.0.0.1', 'localhost', '::1'].includes(String(host).toLowerCase());
}

export function listListeningSockets(port, exec = execFileSync) {
  try {
    const output = exec(
      'lsof',
      ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    ).trim();
    return output ? output.split('\n') : [];
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 1) {
      return [];
    }
    return [
      `Unable to inspect listening sockets with lsof: ${
        error instanceof Error ? error.message : String(error)
      }`,
    ];
  }
}

export async function probePort({
  host,
  port,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  createConnection = net.createConnection,
}) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    let settled = false;

    const settle = (payload) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(payload);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => settle({ ok: true }));
    socket.once('timeout', () => settle({ ok: false, reason: `Connection timed out after ${timeoutMs}ms` }));
    socket.once('error', (error) =>
      settle({
        ok: false,
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
  });
}

export async function checkHealth({
  apiOrigin,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const healthUrl = new URL('/health', apiOrigin).toString();
  const abortController = new AbortController();
  const timer = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const response = await fetchImpl(healthUrl, {
      method: 'GET',
      signal: abortController.signal,
    });
    return {
      ok: response.ok,
      status: response.status,
      healthUrl,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      healthUrl,
      reason: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function buildRemediation({
  hasPortMismatch,
  isListening,
  healthOk,
  authOk,
  apiPort,
  backendPort,
}) {
  const hints = [];

  if (hasPortMismatch) {
    hints.push(
      `Align EXPO_PUBLIC_API_URL port (${apiPort}) and backend PORT (${backendPort}).`,
    );
  }

  if (!isListening) {
    hints.push(
      `Start backend on expected port ${apiPort} (or update EXPO_PUBLIC_API_URL to the active backend port).`,
    );
  }

  if (!healthOk) {
    hints.push('Ensure backend /health is reachable on EXPO_PUBLIC_API_URL before iOS verification.');
  }

  if (!authOk) {
    hints.push('Fix mobile auth preflight vars and Supabase credentials before retrying.');
  }

  return hints;
}

export async function runMobileRuntimeReady({
  mobileEnvPath = MOBILE_ENV_PATH,
  backendEnvPath = BACKEND_ENV_PATH,
  env = process.env,
  fetchImpl = globalThis.fetch,
  runAuthCheck = runMobileAuthCheck,
  portProbe = probePort,
  socketLister = listListeningSockets,
  logger = console.log,
} = {}) {
  const mobileEnv = {
    ...(await loadEnvFile(mobileEnvPath)),
    ...env,
  };
  const backendEnv = {
    ...(await loadEnvFile(backendEnvPath)),
    ...env,
  };

  const apiTarget = parseApiTarget(mobileEnv.EXPO_PUBLIC_API_URL);
  const backendPort = parsePositivePort(backendEnv.PORT, DEFAULT_BACKEND_PORT);
  const diagnostics = [];

  diagnostics.push(
    `API URL (apps/mobile/.env): ${String(mobileEnv.EXPO_PUBLIC_API_URL ?? '<missing>').trim() || '<missing>'}`,
  );
  diagnostics.push(`Backend PORT (apps/backend/.env, default ${DEFAULT_BACKEND_PORT}): ${backendPort}`);

  let hasPortMismatch = true;
  let portCheck = { ok: false, reason: 'Skipped: invalid API target.' };
  let health = { ok: false, healthUrl: 'N/A', reason: 'Skipped: invalid API target.' };
  let listeningSockets = ['Skipped: non-local API host or invalid API URL.'];

  if (apiTarget.ok) {
    hasPortMismatch = apiTarget.port !== backendPort;
    diagnostics.push(
      `Port parity: ${
        hasPortMismatch
          ? `FAIL (EXPO_PUBLIC_API_URL=${apiTarget.port}, backend PORT=${backendPort})`
          : `PASS (${apiTarget.port})`
      }`,
    );

    if (isLocalHost(apiTarget.host)) {
      listeningSockets = socketLister(apiTarget.port);
      portCheck = await portProbe({
        host: apiTarget.host,
        port: apiTarget.port,
      });
    } else {
      portCheck = {
        ok: true,
        reason: `Skipped local listen probe for non-local host (${apiTarget.host}).`,
      };
      listeningSockets = [
        `Skipped local socket listing for non-local host (${apiTarget.host}).`,
      ];
    }

    health = await checkHealth({
      apiOrigin: apiTarget.origin,
      fetchImpl,
    });
  } else {
    diagnostics.push(`Port parity: FAIL (${apiTarget.reason})`);
  }

  let authOk = true;
  let authReason = 'Mobile auth preflight passed.';
  try {
    await runAuthCheck();
  } catch (error) {
    authOk = false;
    authReason = error instanceof Error ? error.message : String(error);
  }

  diagnostics.push(
    `Backend listen probe: ${
      portCheck.ok ? 'PASS' : `FAIL (${portCheck.reason ?? 'could not connect'})`
    }`,
  );
  diagnostics.push('Active listening sockets (expected API port):');
  for (const line of listeningSockets) {
    diagnostics.push(`  ${line}`);
  }
  diagnostics.push(
    `/health reachability (${health.healthUrl}): ${
      health.ok
        ? `PASS (HTTP ${health.status})`
        : `FAIL (${health.reason ?? `HTTP ${health.status ?? 'unknown'}`})`
    }`,
  );
  diagnostics.push(`Auth preflight: ${authOk ? 'PASS' : `FAIL (${authReason})`}`);

  logger('Mobile runtime readiness diagnostics:');
  for (const line of diagnostics) {
    logger(`- ${line}`);
  }

  const verificationFailed = !apiTarget.ok || hasPortMismatch || !portCheck.ok || !health.ok || !authOk;
  if (verificationFailed) {
    const hints = buildRemediation({
      hasPortMismatch,
      isListening: portCheck.ok,
      healthOk: health.ok,
      authOk,
      apiPort: apiTarget.ok ? apiTarget.port : 'unknown',
      backendPort,
    });
    throw new Error(
      [
        'Mobile runtime readiness preflight failed.',
        ...hints.map((hint) => `- ${hint}`),
      ].join('\n'),
    );
  }

  logger('Mobile runtime readiness preflight passed.');
  return {
    apiUrl: mobileEnv.EXPO_PUBLIC_API_URL,
    backendPort,
    healthUrl: health.healthUrl,
  };
}

function parseCliArgs(argv) {
  const normalizedArgs = argv[0] === '--' ? argv.slice(1) : argv;
  if (normalizedArgs.length > 0) {
    throw new Error(
      'Usage: node scripts/orchestrator/mobile-runtime-ready.mjs',
    );
  }
}

async function main() {
  try {
    parseCliArgs(process.argv.slice(2));
    await runMobileRuntimeReady();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
