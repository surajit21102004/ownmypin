const express = require('express');
const { registerBusiness, getMyBusiness } = require('../controllers/business.controller');

const router = express.Router();

router.post('/register', registerBusiness);
router.get('/my-status/:phone', getMyBusiness);

module.exports = router;
