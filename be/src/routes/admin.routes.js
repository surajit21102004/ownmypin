const express = require('express');
const {
  getRegistrations,
  getRegistrationById,
  approveRegistration,
  rejectRegistration,
  requestChanges,
  createNews,
  deleteNews,
  createAd,
  deleteAd,
  getSettings,
  updateSettings,
  createNearbyBusiness,
  deleteNearbyBusiness,
} = require('../controllers/admin.controller');
const { getVerifiedPins } = require('../controllers/pins.controller');
const { getNews, getAds, getNearbyBusinesses } = require('../controllers/content.controller');

const router = express.Router();

// Registrations
router.get('/registrations', getRegistrations);
router.get('/registrations/:id', getRegistrationById);
router.post('/registrations/:id/approve', approveRegistration);
router.post('/registrations/:id/reject', rejectRegistration);
router.post('/registrations/:id/request-changes', requestChanges);

// News (DSC)
router.get('/news', getNews);
router.post('/news', createNews);
router.delete('/news/:id', deleteNews);

// Ads & Notifications
router.get('/ads', getAds);
router.post('/ads', createAd);
router.delete('/ads/:id', deleteAd);

// Monetization Settings (Google Ads vs Manual Ads)
router.get('/settings', getSettings);
router.post('/settings', updateSettings);

// Businesses
router.get('/businesses', getNearbyBusinesses);
router.post('/businesses', createNearbyBusiness);
router.delete('/businesses/:id', deleteNearbyBusiness);

// Verified PINs
router.get('/pins', getVerifiedPins);

module.exports = router;

