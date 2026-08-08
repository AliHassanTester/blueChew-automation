#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

process.env.ENV_TYPE = process.env.ENV_TYPE || 'dev';
process.env.VISUAL_PROVIDERS = 'applitools';

const cliPath = path.join(__dirname, '..', 'node_modules', 'playwright', 'cli.js');
const extraArgs = process.argv.slice(2);
const defaultArgs = [
  'test',
  '(login|product-max)\\.spec\\.ts',
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
