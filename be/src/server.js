const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { testConnection, pool } = require('./config/db');
const apiRoutes = require('./routes/api.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const { renderLocationPage } = require('./controllers/pins.controller');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows admin panel inline scripts and fonts
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve Admin Panel as static web app
const adminPath = path.join(__dirname, '../../admin');
app.use('/admin', express.static(adminPath));
app.use('/startupindia.png', express.static(path.join(adminPath, 'startupindia.png')));

// Serve Uploaded Files statically with cross-origin & private-network permission
const uploadsPath = path.join(__dirname, '../uploads');
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  },
  express.static(uploadsPath)
);

// Public Doorstep Location Viewer (when scanning QR code)
app.get('/location', renderLocationPage);
app.get('/pin/:pinCode', renderLocationPage);
app.get('/p/:pinCode', renderLocationPage);

// API Routes
app.use('/api', apiRoutes);

// Root route redirects to /admin or returns API health
app.get('/', (req, res) => {
  res.json({
    app: 'ownMyPin Backend Server',
    status: 'Running',
    version: '1.0.0',
    adminPanel: `http://localhost:${PORT}/admin`,
    apiDocumentation: `http://localhost:${PORT}/api`,
    sampleQrLocation: `http://localhost:${PORT}/location?pin=WB-09-45896524`,
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
  console.log(` API URL:     http://localhost:${PORT}/api`);
  console.log(` Admin Panel: http://localhost:${PORT}/admin`);
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
