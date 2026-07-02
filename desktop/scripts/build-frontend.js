#!/usr/bin/env node
// Builds the existing ../frontend project as-is (no source changes) with a
// relative API base URL, since the desktop app serves the API and the
// static frontend from the same Express instance/port. Output is copied
// into server/public for Express to serve.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT, '..', 'frontend');
const DIST_DIR = path.join(FRONTEND_DIR, 'dist');
const PUBLIC_DIR = path.join(ROOT, 'server', 'public');

if (!fs.existsSync(path.join(FRONTEND_DIR, 'node_modules'))) {
  console.log('Installing frontend dependencies...');
  execSync('npm install', { cwd: FRONTEND_DIR, stdio: 'inherit' });
}

console.log('Building frontend (VITE_API_URL=/api)...');
execSync('npx vite build', {
  cwd: FRONTEND_DIR,
  stdio: 'inherit',
  env: { ...process.env, VITE_API_URL: '/api' },
});

console.log('Copying build output into server/public...');
fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.cpSync(DIST_DIR, PUBLIC_DIR, { recursive: true });

console.log('Frontend build copied to', PUBLIC_DIR);
