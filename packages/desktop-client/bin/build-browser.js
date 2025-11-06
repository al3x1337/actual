#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.resolve(ROOT, 'build');
const PUBLIC_DIR = path.resolve(ROOT, 'public');
const KCAB_DIR = path.resolve(PUBLIC_DIR, 'kcab');

console.log('Building the browser...');

// Remove build directory
if (fs.existsSync(BUILD_DIR)) {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}

process.env.IS_GENERIC_BROWSER = '1';

// Find the worker hash from kcab.worker.*.js files
let workerHash = 'dev';
if (fs.existsSync(KCAB_DIR)) {
  const files = fs.readdirSync(KCAB_DIR);
  const workerFile = files.find(
    f => f.startsWith('kcab.worker.') && f.endsWith('.js'),
  );
  if (workerFile) {
    const match = workerFile.match(/kcab\.worker\.(.+)\.js/);
    if (match) {
      workerHash = match[1];
    }
  }
}
process.env.REACT_APP_BACKEND_WORKER_HASH = workerHash;

try {
  execSync('yarn build', {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
    },
  });
} catch (error) {
  process.exit(1);
}

// Move stats files
const buildStatsDir = path.resolve(ROOT, 'build-stats');
if (fs.existsSync(buildStatsDir)) {
  fs.rmSync(buildStatsDir, { recursive: true, force: true });
}
fs.mkdirSync(buildStatsDir, { recursive: true });

const kcabStats = path.resolve(BUILD_DIR, 'kcab/stats.json');
const webStats = path.resolve(ROOT, 'stats.json');

if (fs.existsSync(kcabStats)) {
  fs.copyFileSync(
    kcabStats,
    path.resolve(buildStatsDir, 'loot-core-stats.json'),
  );
}

if (fs.existsSync(webStats)) {
  fs.copyFileSync(webStats, path.resolve(buildStatsDir, 'web-stats.json'));
}
