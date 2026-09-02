#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const providerArg = process.argv[2] || process.env.VISUAL_PROVIDER || 'applitools';
const providers = providerArg.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);

if (!providers.length) {
  console.error('Usage: node scripts/run-visual.js <applitools>');
  process.exit(1);
}

process.env.ENV_TYPE = process.env.ENV_TYPE || 'dev';
process.env.VISUAL_PROVIDERS = providers.join(',');

const cliPath = path.join(__dirname, '..', 'node_modules', 'playwright', 'cli.js');
const extraArgs = process.argv.slice(3);
const defaultArgs = [
  'test',
  '(login|product-checkout)\\.spec\\.ts',
  '--project=chromium-desktop',
];
const args = extraArgs.length > 0 ? ['test', ...extraArgs] : defaultArgs;

const child = spawn(process.execPath, [cliPath, ...args], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code || 0);
});
