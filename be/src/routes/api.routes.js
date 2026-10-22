const express = require('express');
const healthRoutes = require('./health.routes');

const router = express.Router();

// Mount sub-routers
router.use('/health', healthRoutes);

// Base API route info
router.get('/', (req, res) => {
  res.json({
    app: 'ownMyPin API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      dbHealth: '/api/health/db',
    },
  });
});

module.exports = router;
