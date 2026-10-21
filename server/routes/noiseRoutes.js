const express = require('express');
const router = express.Router();
const { logNoise, getNoiseLogs, getNoiseAnalytics } = require('../controllers/noiseController');

router.post('/', logNoise);
router.get('/', getNoiseLogs);
router.get('/analytics', getNoiseAnalytics);

module.exports = router;

