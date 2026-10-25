const express = require('express');
const {
  sendOtp,
  verifyOtp,
  loginWithPassword,
  registerAccount,
} = require('../controllers/auth.controller');

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginWithPassword);
router.post('/register', registerAccount);

module.exports = router;
