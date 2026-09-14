#!/usr/bin/env node
/**
 * Convenience wrapper forwarding to test-visual.js with provider argument.
 */
const providerArg = process.argv[2] || process.env.VISUAL_PROVIDER || 'applitools';
process.env.VISUAL_PROVIDERS = providerArg;
require('./test-visual');
