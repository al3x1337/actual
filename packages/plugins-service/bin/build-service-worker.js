#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PLUGINS_SERVICE_DIR = path.resolve(ROOT, '..');
const DIST_DIR = path.resolve(PLUGINS_SERVICE_DIR, 'dist');
const DESKTOP_DIR = path.resolve(PLUGINS_SERVICE_DIR, '../../desktop-client');
const SERVICE_WORKER_DIR = path.resolve(DESKTOP_DIR, 'service-worker');

const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV === 'development';
const isWatch = process.argv.includes('--watch');

// Clean out previous build files
if (fs.existsSync(DIST_DIR)) {
  const files = fs.readdirSync(DIST_DIR);
  for (const file of files) {
    fs.unlinkSync(path.join(DIST_DIR, file));
  }
}

// Remove service-worker directory if it exists
if (fs.existsSync(SERVICE_WORKER_DIR)) {
  fs.rmSync(SERVICE_WORKER_DIR, { recursive: true, force: true });
}

if (isDev) {
  // In development, create a symlink
  // Ensure the dist directory exists first
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Create symlink (Windows requires special handling)
  try {
    if (process.platform === 'win32') {
      // On Windows, use junction or symlink
      // Try junction first (works without admin), then symlink
      try {
        execSync(`mklink /J "${SERVICE_WORKER_DIR}" "${DIST_DIR}"`, {
          stdio: 'ignore',
        });
      } catch {
        // Junction failed, try symlink (requires admin)
        fs.symlinkSync(DIST_DIR, SERVICE_WORKER_DIR, 'dir');
      }
    } else {
      fs.symlinkSync(DIST_DIR, SERVICE_WORKER_DIR, 'dir');
    }
  } catch (error) {
    // If symlink fails, we'll just copy the files after build
    console.warn('Warning: Could not create symlink, will copy files instead');
  }
}

// Run vite build
const viteArgs = isWatch ? '--watch' : '';
const viteCmd = `yarn vite build --config ${path.resolve(PLUGINS_SERVICE_DIR, 'vite.config.mts')} --mode ${NODE_ENV} ${viteArgs}`;

try {
  execSync(viteCmd, {
    cwd: PLUGINS_SERVICE_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV,
    },
  });
} catch (error) {
  process.exit(1);
}

if (!isDev) {
  // In production, copy the built files
  if (!fs.existsSync(SERVICE_WORKER_DIR)) {
    fs.mkdirSync(SERVICE_WORKER_DIR, { recursive: true });
  }

  const files = fs.readdirSync(DIST_DIR);
  for (const file of files) {
    const src = path.join(DIST_DIR, file);
    const dest = path.join(SERVICE_WORKER_DIR, file);
    const stat = fs.statSync(src);

    if (stat.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
} else if (!fs.existsSync(SERVICE_WORKER_DIR)) {
  // If symlink failed in dev, copy files as fallback
  if (!fs.existsSync(SERVICE_WORKER_DIR)) {
    fs.mkdirSync(SERVICE_WORKER_DIR, { recursive: true });
  }

  const files = fs.readdirSync(DIST_DIR);
  for (const file of files) {
    const src = path.join(DIST_DIR, file);
    const dest = path.join(SERVICE_WORKER_DIR, file);
    const stat = fs.statSync(src);

    if (stat.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}
