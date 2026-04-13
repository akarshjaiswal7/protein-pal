const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/daily-summary/:userId', analyticsController.getDailySummary);
router.get('/weekly-summary/:userId', analyticsController.getWeeklySummary);

module.exports = router;
