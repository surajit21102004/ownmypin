const express = require('express');
const { testConnection } = require('../config/db');

const router = express.Router();

// General server health
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ownMyPin Backend Server is running healthy!',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Database connectivity check
router.get('/db', async (req, res, next) => {
  try {
    const result = await testConnection();
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(503).json(result);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
