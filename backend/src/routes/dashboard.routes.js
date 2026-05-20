const express = require('express');
const { getSummary } = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/summary', getSummary);

module.exports = router;
