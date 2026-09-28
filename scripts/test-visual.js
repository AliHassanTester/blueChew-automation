#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Determine env type (default: dev)
const envType = process.env.ENV_TYPE || 'dev';
const envFile = path.resolve(process.cwd(), `.env.${envType}`);

if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
}

// Allow explicit provider selection via CLI: --providers=playwright or --providers=applitools
const providerArg = process.argv.find((a) => a.startsWith('--providers='));
if (providerArg) {
  process.env.VISUAL_PROVIDERS = providerArg.split('=')[1];
}

// Default to playwright if running test-visual without providers specified
if (!process.env.VISUAL_PROVIDERS || process.env.VISUAL_PROVIDERS === 'none') {
  process.env.VISUAL_PROVIDERS = 'playwright';
}

const providers = process.env.VISUAL_PROVIDERS.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

// Filter out visual-runner flags from arguments forwarded to Playwright
const extraArgs = process.argv.slice(2).filter((a) => !a.startsWith('--providers=')).join(' ');
const defaultArgs = '--grep "@visual"';
const argsToPass = extraArgs ? extraArgs : defaultArgs;

const cmd = `npx playwright test ${argsToPass}`.trim();
console.log('[visual-runner] Active Providers:', providers.join(', '));
console.log('[visual-runner] Executing Playwright Visual Command:', cmd);

const child = spawn(cmd, { shell: true, stdio: 'inherit', env: process.env });
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code || 0);
});
