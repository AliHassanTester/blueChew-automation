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

// Provide a helpful error if token is missing
if (!process.env.PERCY_TOKEN || process.env.PERCY_TOKEN === '') {
  console.error('[percy-runner] ERROR: PERCY_TOKEN not found in environment.');
  console.error(`Loaded env file: ${envFile}`);
  process.exitCode = 2;
  process.exit();
}

const cmd = 'npx percy exec -- npx playwright test --grep @visual';

console.log('[percy-runner] Running:', cmd);

const child = spawn(cmd, { shell: true, stdio: 'inherit', env: process.env });

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code);
});
