// Unlike backend/src/server.js, this does not auto-start on require() - the
// Electron main process sets DATABASE_URL/JWT_SECRET/PORT itself (there is
// no .env file in the packaged app) and calls startServer() once it's ready.
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'];

const startServer = () =>
  new Promise((resolve, reject) => {
    const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
    if (missingEnvVars.length > 0) {
      reject(new Error(`Missing required environment variable(s): ${missingEnvVars.join(', ')}`));
      return;
    }

    const app = require('./app');
    const prisma = require('./config/database');

    const PORT = process.env.PORT || 5051;
    // 127.0.0.1 only - this server is never meant to be reachable over the network.
    const server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`Embedded server listening on http://127.0.0.1:${PORT}`);
      resolve({ server, port: PORT });
    });

    server.on('error', reject);

    const shutdown = async (signal, exitCode = 0) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(exitCode);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Rejection:', err);
    });
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
    });
  });

module.exports = { startServer };
