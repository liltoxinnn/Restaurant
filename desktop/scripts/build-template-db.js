#!/usr/bin/env node
// Builds resources/template.db: a fresh SQLite database with all migrations
// applied and default demo data seeded. The packaged app copies this file to
// the user's data directory on first launch instead of running Prisma
// Migrate at runtime (simpler and more reliable inside a packaged app).
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCHEMA = path.join(ROOT, 'server', 'prisma', 'schema.prisma');
const SEED = path.join(ROOT, 'server', 'prisma', 'seed.js');
const BUILD_DB = path.join(ROOT, 'server', 'prisma', 'build.db');
const TEMPLATE_DB = path.join(ROOT, 'resources', 'template.db');

if (fs.existsSync(BUILD_DB)) fs.unlinkSync(BUILD_DB);

const env = { ...process.env, DATABASE_URL: `file:${BUILD_DB}` };

console.log('Applying migrations to a fresh database...');
execSync(`npx prisma migrate deploy --schema="${SCHEMA}"`, { stdio: 'inherit', env, cwd: ROOT });

console.log('Seeding default data...');
execSync(`node "${SEED}"`, { stdio: 'inherit', env, cwd: ROOT });

fs.mkdirSync(path.dirname(TEMPLATE_DB), { recursive: true });
fs.copyFileSync(BUILD_DB, TEMPLATE_DB);
fs.unlinkSync(BUILD_DB);

console.log(`Template database written to ${TEMPLATE_DB}`);
