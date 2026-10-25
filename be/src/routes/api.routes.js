const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const registrationRoutes = require('./registration.routes');
const adminRoutes = require('./admin.routes');
const uploadRoutes = require('./upload.routes');
const pinsRoutes = require('./pins.routes');
const contentRoutes = require('./content.routes');
const businessRoutes = require('./business.routes');

const router = express.Router();

// Mount sub-routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/registrations', registrationRoutes);
router.use('/business', businessRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/pins', pinsRoutes);
router.use('/content', contentRoutes);

// Base API route info
router.get('/', (req, res) => {
  res.json({
    app: 'ownMyPin API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      dbHealth: '/api/health/db',
      auth: {
        sendOtp: 'POST /api/auth/send-otp',
        verifyOtp: 'POST /api/auth/verify-otp',
      },
      registrations: {
        create: 'POST /api/registrations',
        status: 'GET /api/registrations/my-status/:phone',
      },
      admin: {
        list: 'GET /api/admin/registrations',
        approve: 'POST /api/admin/registrations/:id/approve',
        reject: 'POST /api/admin/registrations/:id/reject',
      },
    },
  });
});

module.exports = router;
