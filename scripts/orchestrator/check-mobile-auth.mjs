#!/usr/bin/env node

import { loadMobileEnv, validateMobileAuthEnv, verifySupabasePasswordAuth } from './lib/mobile-auth.mjs';

export async function runMobileAuthCheck() {
  const env = await loadMobileEnv();
  const validation = validateMobileAuthEnv(env);

  if (!validation.ok) {
    const missingVars = validation.missing.map((key) => `  - ${key}`).join('\n');
    throw new Error(
      [
        'Mobile auth preflight failed: missing required environment variables.',
        missingVars,
        '',
        'Remediation:',
        '  1. Populate apps/mobile/.env (or exported shell env) with the missing keys.',
        '  2. Ensure EXPO_PUBLIC_AUTO_LOGIN_EMAIL / EXPO_PUBLIC_AUTO_LOGIN_PASSWORD belong to a valid Supabase user.',
        '  3. Ensure EXPO_PUBLIC_DEV_USER_ID is set for deterministic dev-bypass workflows.',
      ].join('\n'),
    );
  }

  const auth = await verifySupabasePasswordAuth(env);

  console.log('Mobile auth preflight passed.');
  console.log('Validated env keys and Supabase password login for EXPO_PUBLIC_AUTO_LOGIN_EMAIL.');
  return { env, auth };
}

async function main() {
  try {
    await runMobileAuthCheck();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
