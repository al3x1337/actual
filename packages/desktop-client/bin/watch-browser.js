#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

process.env.IS_GENERIC_BROWSER = '1';
process.env.PORT = '3001';
process.env.REACT_APP_BACKEND_WORKER_HASH = 'dev';

try {
  execSync('yarn start', {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
    },
  });
} catch (error) {
  process.exit(1);
}
