const express = require('express');
const {
  createRegistration,
  getMyRegistration,
} = require('../controllers/registration.controller');

const router = express.Router();

router.post('/', createRegistration);
router.get('/my-status/:phone', getMyRegistration);

module.exports = router;
