const express = require('express');
const router = express.Router();
const mealPlanController = require('../controllers/mealPlanController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/save', verifyToken, mealPlanController.saveMealPlan);
router.get('/:userId', verifyToken, mealPlanController.getLatestPlan);
router.get('/history/:userId', verifyToken, mealPlanController.getHistory);
router.get('/details/:planId', verifyToken, mealPlanController.getPlanById);
router.post('/log-full/:planId', verifyToken, mealPlanController.logFullPlan);

module.exports = router;
