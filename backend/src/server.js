require('dotenv').config();

const app = require('./app');
const prisma = require('./config/database');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Restaurant Management API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
