const { app, BrowserWindow, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DEFAULT_PORT = 5051;

let mainWindow;

function getUserDbPath() {
  return path.join(app.getPath('userData'), 'restaurant.db');
}

function getTemplateDbPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'template.db')
    : path.join(__dirname, 'resources', 'template.db');
}

// On first launch there is no database yet - seed one from the bundled
// template (already migrated + populated with default accounts) rather
// than running Prisma Migrate at runtime.
function ensureDatabase() {
  const dbPath = getUserDbPath();
  if (!fs.existsSync(dbPath)) {
    fs.copyFileSync(getTemplateDbPath(), dbPath);
  }
  return dbPath;
}

// A random JWT signing secret, generated once and persisted alongside the
// database so sessions survive app restarts.
function getOrCreateJwtSecret() {
  const secretPath = path.join(app.getPath('userData'), 'jwt.secret');
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf8').trim();
  }
  const secret = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(secretPath, secret, 'utf8');
  return secret;
}

async function startEmbeddedServer() {
  const dbPath = ensureDatabase();

  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.JWT_SECRET = getOrCreateJwtSecret();
  process.env.JWT_EXPIRES_IN = '30d';
  process.env.NODE_ENV = 'production';
  process.env.PORT = String(DEFAULT_PORT);

  // eslint-disable-next-line global-require
  const { startServer } = require('./server/src/server');
  return startServer();
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Le Coin des Pêcheurs',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(async () => {
  try {
    const { port } = await startEmbeddedServer();
    createWindow(port);
  } catch (err) {
    dialog.showErrorBox('Le Coin des Pêcheurs — Startup Error', String(err?.stack || err));
    app.quit();
    return;
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(DEFAULT_PORT);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
