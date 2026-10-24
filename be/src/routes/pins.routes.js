const express = require('express');
const { searchPin, getVerifiedPins, getPinQrCode } = require('../controllers/pins.controller');
const { getNearbyBusinesses } = require('../controllers/content.controller');

const router = express.Router();

router.get('/search', searchPin);
router.get('/verified', getVerifiedPins);
router.get('/nearby', getNearbyBusinesses);
router.get('/qr/:pinCode', getPinQrCode);
router.get('/qr', getPinQrCode);

module.exports = router;
