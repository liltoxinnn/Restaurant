// Copies the built frontend (frontend/dist) into backend/public so the
// Express server can serve it as static files in production. Only used by
// the root "build" script (Railway); local dev never touches this.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'frontend', 'dist');
const dest = path.join(__dirname, '..', 'backend', 'public');

if (!fs.existsSync(src)) {
  console.error(`Frontend build not found at ${src}. Run "npm run build --prefix frontend" first.`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

console.log(`Copied frontend build: ${src} -> ${dest}`);
