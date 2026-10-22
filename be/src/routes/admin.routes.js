const express = require('express');
const {
  getRegistrations,
  getRegistrationById,
  approveRegistration,
  rejectRegistration,
  requestChanges,
} = require('../controllers/admin.controller');

const router = express.Router();

router.get('/registrations', getRegistrations);
router.get('/registrations/:id', getRegistrationById);
router.post('/registrations/:id/approve', approveRegistration);
router.post('/registrations/:id/reject', rejectRegistration);
router.post('/registrations/:id/request-changes', requestChanges);

module.exports = router;
