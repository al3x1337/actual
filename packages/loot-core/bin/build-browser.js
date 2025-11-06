#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const LOOT_CORE_DIR = path.resolve(ROOT, '..');
const PUBLIC_DIR = path.resolve(LOOT_CORE_DIR, '../../desktop-client/public');
const DATA_DIR = path.resolve(PUBLIC_DIR, 'data');
const LIB_DIST_BROWSER = path.resolve(LOOT_CORE_DIR, 'lib-dist/browser');
const KCAB_DIR = path.resolve(PUBLIC_DIR, 'kcab');
const NODE_MODULES_DIR = path.resolve(LOOT_CORE_DIR, '../../node_modules');

const NODE_ENV = process.env.NODE_ENV || 'production';
const isDev = NODE_ENV === 'development';
const isWatch = process.argv.includes('--watch') || isDev;

// Copy migrations
const copyMigrationsScript = path.resolve(ROOT, 'copy-migrations.js');
if (fs.existsSync(copyMigrationsScript)) {
  execSync(`node ${copyMigrationsScript} "${DATA_DIR}"`, {
    cwd: ROOT,
    stdio: 'inherit',
  });
} else {
  // Fallback: copy migrations manually
  const migrationsDir = path.resolve(LOOT_CORE_DIR, 'migrations');
  const destMigrationsDir = path.resolve(DATA_DIR, 'migrations');

  if (fs.existsSync(destMigrationsDir)) {
    fs.rmSync(destMigrationsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destMigrationsDir, { recursive: true });

  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir);
    for (const file of files) {
      const src = path.join(migrationsDir, file);
      const dest = path.join(destMigrationsDir, file);
      const stat = fs.statSync(src);
      if (stat.isFile()) {
        fs.copyFileSync(src, dest);
      }
    }
  }

  // Copy default-db.sqlite
  const defaultDb = path.resolve(LOOT_CORE_DIR, 'default-db.sqlite');
  if (fs.existsSync(defaultDb)) {
    fs.copyFileSync(defaultDb, path.resolve(DATA_DIR, 'default-db.sqlite'));
  }
}

// Create data file index
fs.mkdirSync(DATA_DIR, { recursive: true });
const dataFiles = [];
function collectFiles(dir, baseDir = DATA_DIR) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (stat.isDirectory()) {
      collectFiles(fullPath, baseDir);
    } else {
      dataFiles.push(relativePath);
    }
  }
}
collectFiles(DATA_DIR);
dataFiles.sort();
fs.writeFileSync(
  path.resolve(PUBLIC_DIR, 'data-file-index.txt'),
  dataFiles.join('\n') + '\n',
);

// Clean out previous build files
if (fs.existsSync(LIB_DIST_BROWSER)) {
  const files = fs.readdirSync(LIB_DIST_BROWSER);
  for (const file of files) {
    const filePath = path.join(LIB_DIST_BROWSER, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  }
} else {
  fs.mkdirSync(LIB_DIST_BROWSER, { recursive: true });
}

if (fs.existsSync(KCAB_DIR)) {
  fs.rmSync(KCAB_DIR, { recursive: true, force: true });
}

let symlinkFailed = false;
if (isDev || isWatch) {
  // In dev mode, create a symlink
  if (!fs.existsSync(LIB_DIST_BROWSER)) {
    fs.mkdirSync(LIB_DIST_BROWSER, { recursive: true });
  }

  // Create symlink (Windows requires special handling)
  try {
    if (process.platform === 'win32') {
      // On Windows, use junction or symlink
      try {
        execSync(`mklink /J "${KCAB_DIR}" "${LIB_DIST_BROWSER}"`, {
          stdio: 'ignore',
        });
        // Verify the symlink was created
        if (!fs.existsSync(KCAB_DIR)) {
          throw new Error('Symlink creation failed');
        }
      } catch {
        // Junction failed, try symlink (requires admin)
        try {
          fs.symlinkSync(LIB_DIST_BROWSER, KCAB_DIR, 'dir');
          // Verify the symlink was created
          if (!fs.existsSync(KCAB_DIR)) {
            throw new Error('Symlink creation failed');
          }
        } catch {
          symlinkFailed = true;
          console.warn(
            'Warning: Could not create symlink, will copy files instead',
          );
        }
      }
    } else {
      try {
        fs.symlinkSync(LIB_DIST_BROWSER, KCAB_DIR, 'dir');
        // Verify the symlink was created
        if (!fs.existsSync(KCAB_DIR)) {
          throw new Error('Symlink creation failed');
        }
      } catch {
        symlinkFailed = true;
        console.warn(
          'Warning: Could not create symlink, will copy files instead',
        );
      }
    }
  } catch (error) {
    // If symlink fails, we'll copy files after build
    symlinkFailed = true;
    console.warn('Warning: Could not create symlink, will copy files instead');
  }
}

// Copy sql-wasm.wasm
const sqlWasmSource = path.resolve(
  NODE_MODULES_DIR,
  '@jlongster/sql.js/dist/sql-wasm.wasm',
);
if (fs.existsSync(sqlWasmSource)) {
  fs.copyFileSync(sqlWasmSource, path.resolve(PUBLIC_DIR, 'sql-wasm.wasm'));
}

// Run vite build
const viteArgs = isDev || isWatch ? '--watch' : '';
const viteCmd = `yarn vite build --config ${path.resolve(LOOT_CORE_DIR, 'vite.config.ts')} --mode ${NODE_ENV} ${viteArgs}`;

// Function to copy files from lib-dist/browser to kcab
function copyKcabFiles() {
  if (!fs.existsSync(KCAB_DIR)) {
    fs.mkdirSync(KCAB_DIR, { recursive: true });
  }

  if (fs.existsSync(LIB_DIST_BROWSER)) {
    const files = fs.readdirSync(LIB_DIST_BROWSER);
    for (const file of files) {
      const src = path.join(LIB_DIST_BROWSER, file);
      const dest = path.join(KCAB_DIR, file);
      try {
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
          if (fs.existsSync(dest)) {
            fs.rmSync(dest, { recursive: true, force: true });
          }
          fs.cpSync(src, dest, { recursive: true });
        } else {
          fs.copyFileSync(src, dest);
        }
      } catch (err) {
        // Ignore errors for individual files
      }
    }
  }
}

// If symlink failed, copy files immediately if they already exist
if (symlinkFailed && (isDev || isWatch)) {
  copyKcabFiles();
}

try {
  execSync(viteCmd, {
    cwd: LOOT_CORE_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV,
    },
  });
} catch (error) {
  process.exit(1);
}

if (!isDev && !isWatch) {
  // In production, copy the built files
  if (!fs.existsSync(KCAB_DIR)) {
    fs.mkdirSync(KCAB_DIR, { recursive: true });
  }

  if (fs.existsSync(LIB_DIST_BROWSER)) {
    const files = fs.readdirSync(LIB_DIST_BROWSER);
    for (const file of files) {
      const src = path.join(LIB_DIST_BROWSER, file);
      const dest = path.join(KCAB_DIR, file);
      const stat = fs.statSync(src);

      if (stat.isDirectory()) {
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.copyFileSync(src, dest);
      }
    }
  }
} else if (symlinkFailed && !fs.existsSync(KCAB_DIR)) {
  // If symlink failed in dev, copy files as fallback
  copyKcabFiles();
}
