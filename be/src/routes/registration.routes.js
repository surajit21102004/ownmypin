const express = require('express');
const {
  createRegistration,
  getMyRegistration,
  updateRegistrationProfile,
} = require('../controllers/registration.controller');

const router = express.Router();

router.post('/', createRegistration);
router.get('/my-status/:phone', getMyRegistration);
router.post('/update-profile', updateRegistrationProfile);
router.put('/update-profile', updateRegistrationProfile);

module.exports = router;
