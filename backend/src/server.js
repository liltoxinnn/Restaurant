require('dotenv').config();

const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variable(s): ${missingEnvVars.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the values before starting the server.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET is too short for production use. Use at least 32 random characters.');
  process.exit(1);
}

const app = require('./app');
const prisma = require('./config/database');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Restaurant Management API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

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
  shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('uncaughtException', 1);
});
