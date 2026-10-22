const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { testConnection, pool } = require('./config/db');
const apiRoutes = require('./routes/api.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    app: 'ownMyPin Backend Server',
    status: 'Running',
    version: '1.0.0',
    documentation: '/api',
  });
});

// 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(` ownMyPin Backend Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` API URL: http://localhost:${PORT}/api`);
  console.log(`===============================================`);

  // Verify DB on boot
  const dbCheck = await testConnection();
  if (dbCheck.success) {
    console.log(`[Database] Connected to MySQL (${dbCheck.details.database}) on ${dbCheck.details.host}`);
  } else {
    console.error(`[Database Warning] Could not connect: ${dbCheck.message}`);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  console.log('\nGracefully shutting down...');
  server.close(async () => {
    console.log('HTTP server closed.');
    await pool.end();
    console.log('MySQL pool closed.');
    process.exit(0);
  });
}

module.exports = app;
