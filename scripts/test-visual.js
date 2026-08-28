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

// Allow explicit provider selection via CLI: --providers=applitools
const providerArg = process.argv.find((a) => a.startsWith('--providers='));
if (providerArg) {
  process.env.VISUAL_PROVIDERS = providerArg.split('=')[1];
}

// Default to applitools as visual provider
if (!process.env.VISUAL_PROVIDERS) {
  process.env.VISUAL_PROVIDERS = 'applitools';
}

const providers = process.env.VISUAL_PROVIDERS.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

// Helper to check if any test specs contain focused tests (.only)
// Because Playwright ignores test.only when a global --grep filter is active
function hasFocusedTests(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (hasFocusedTests(fullPath)) return true;
    } else if (file.endsWith('.spec.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('test.only') || content.includes('describe.only')) {
        return true;
      }
    }
  }
  return false;
}

const specsDir = path.resolve(process.cwd(), 'src/specs');
const hasOnly = fs.existsSync(specsDir) && hasFocusedTests(specsDir);

const extraArgs = process.argv.filter((a) => !a.startsWith('--providers=')).slice(2).join(' ');
const defaultArgs = hasOnly ? '' : '--grep @visual';
const argsToPass = extraArgs ? extraArgs : defaultArgs;

// Execute Playwright directly
const cmd = `npx playwright test ${argsToPass}`.trim();
console.log('[visual-runner] Active Providers:', providers.join(', '));
console.log('[visual-runner] Executing Command:', cmd);

const child = spawn(cmd, { shell: true, stdio: 'inherit', env: process.env });
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code);
});
