#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..'); // loot-core directory
const DEST = process.argv[2];

if (!DEST) {
  console.error('Usage: copy-migrations.js <destination>');
  process.exit(1);
}

const migrationsDir = path.resolve(ROOT, 'migrations');
const destMigrationsDir = path.resolve(DEST, 'migrations');
const defaultDb = path.resolve(ROOT, 'default-db.sqlite');

// Remove existing migrations directory
if (fs.existsSync(destMigrationsDir)) {
  fs.rmSync(destMigrationsDir, { recursive: true, force: true });
}

// Create destination directory
fs.mkdirSync(destMigrationsDir, { recursive: true });

// Copy migrations
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
if (fs.existsSync(defaultDb)) {
  fs.copyFileSync(defaultDb, path.resolve(DEST, 'default-db.sqlite'));
}
