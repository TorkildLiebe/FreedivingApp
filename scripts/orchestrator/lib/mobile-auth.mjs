import { readFile } from 'node:fs/promises';

const MOBILE_ENV_FILE = 'apps/mobile/.env';

function parseDotEnv(content) {
  const values = {};
  const lines = String(content).split('\n');
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

export async function loadMobileEnv(filePath = MOBILE_ENV_FILE) {
  let fileValues = {};
  try {
    const raw = await readFile(filePath, 'utf8');
    fileValues = parseDotEnv(raw);
  } catch {
    fileValues = {};
  }

  return {
    ...fileValues,
    ...process.env,
  };
}

export function validateMobileAuthEnv(env) {
  const required = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_AUTO_LOGIN_EMAIL',
    'EXPO_PUBLIC_AUTO_LOGIN_PASSWORD',
    'EXPO_PUBLIC_DEV_USER_ID',
  ];

  const missing = required.filter((key) => !String(env[key] ?? '').trim());
  return {
    ok: missing.length === 0,
    missing,
  };
}

export async function verifySupabasePasswordAuth(env) {
  const supabaseUrl = String(env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  const anonKey = String(env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '');
  const email = String(env.EXPO_PUBLIC_AUTO_LOGIN_EMAIL ?? '');
  const password = String(env.EXPO_PUBLIC_AUTO_LOGIN_PASSWORD ?? '');

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.access_token) {
    const message =
      payload?.msg ||
      payload?.error_description ||
      payload?.error ||
      `HTTP ${response.status}`;
    throw new Error(`Supabase password login failed for EXPO_PUBLIC_AUTO_LOGIN_EMAIL (${message}).`);
  }

  return {
    accessToken: payload.access_token,
    userId: payload.user?.id ?? null,
  };
}
