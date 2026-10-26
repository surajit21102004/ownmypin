const express = require('express');
const {
  initiateDigilocker,
  callbackDigilocker,
  completeDigilocker,
  handleBrowserRedirect,
  getDigilockerStatus,
} = require('../controllers/digilocker.controller');

const router = express.Router();

router.post('/initiate', initiateDigilocker);
router.post('/callback', callbackDigilocker);
router.post('/complete', completeDigilocker);
router.get('/redirect', handleBrowserRedirect);
router.get('/status/:phone', getDigilockerStatus);

module.exports = router;
