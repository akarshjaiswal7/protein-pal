const express = require('express');
const router = express.Router();
const calculatorController = require('../controllers/calculatorController');

router.post('/calculate-goal', calculatorController.calculateGoal);
router.post('/generate-meal-plan', calculatorController.generateMealPlan);

module.exports = router;
