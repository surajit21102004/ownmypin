const express = require('express');
const {
  getNews,
  getAds,
  getNotifications,
  getNearbyBusinesses,
} = require('../controllers/content.controller');

const router = express.Router();

router.get('/news', getNews);
router.get('/ads', getAds);
router.get('/notifications', getNotifications);
router.get('/nearby', getNearbyBusinesses);

module.exports = router;
