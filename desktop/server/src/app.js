const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// The desktop app serves the built frontend and the API from the same
// Express instance/port, so this is effectively always same-origin. CORS
// is configured permissively (reflect the request origin) since the server
// only ever binds to 127.0.0.1 and is never reachable from the network.
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is healthy', data: { uptime: process.uptime() } });
});

app.use('/api', routes);

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Client-side routing (React Router): any non-API, non-file GET request
// falls back to index.html.
app.get(/^(?!\/api).*/, (req, res, next) => {
  res.sendFile(path.join(publicDir, 'index.html'), (err) => {
    if (err) next(err);
  });
});

app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
