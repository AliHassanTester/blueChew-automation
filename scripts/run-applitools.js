#!/usr/bin/env node
/**
 * Convenience wrapper forwarding to test-visual.js with Applitools provider.
 */
process.env.VISUAL_PROVIDERS = 'applitools';
require('./test-visual');
