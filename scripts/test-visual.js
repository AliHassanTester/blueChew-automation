#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Determine env type (default: dev)
const envType = process.env.ENV_TYPE || 'dev';
const envFile = path.resolve(process.cwd(), `.env.${envType}`);

if (fs.existsSync(envFile)) {
  // Load dotenv into process.env
  require('dotenv').config({ path: envFile });
}

// Ensure PERCY_ENABLED defaults to true unless explicitly disabled
if (typeof process.env.PERCY_ENABLED === 'undefined') {
  process.env.PERCY_ENABLED = 'true';
}

// Allow explicit provider selection via CLI: --providers=percy,applitools
const providerArg = process.argv.find((a) => a.startsWith('--providers='));
if (providerArg) {
  process.env.VISUAL_PROVIDERS = providerArg.split('=')[1];
}

// If Percy is enabled as a provider, require PERCY_TOKEN.
const providers = (process.env.VISUAL_PROVIDERS || 'percy').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const wantsPercy = providers.includes('percy');

if (wantsPercy) {
  if (!process.env.PERCY_TOKEN || process.env.PERCY_TOKEN === '') {
    console.error('[percy-runner] ERROR: PERCY_TOKEN not found in environment.');
    console.error(`Loaded env file: ${envFile}`);
    process.exitCode = 2;
    process.exit();
  }
}

const extraArgs = process.argv.filter((a) => !a.startsWith('--providers=')).slice(2).join(' ');

// If Percy is requested, run via the percy exec wrapper. Otherwise run playwright directly.
let cmd;
if (wantsPercy) {
  cmd = `npx percy exec -- npx playwright test --grep @visual ${extraArgs}`.trim();
} else {
  cmd = `npx playwright test --grep @visual ${extraArgs}`.trim();
}

console.log('[visual-runner] Providers:', providers.join(','));
console.log('[visual-runner] Running:', cmd);

const child = spawn(cmd, { shell: true, stdio: 'inherit', env: process.env });

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code);
});
