const express = require('express');
const router = express.Router();
const intakeController = require('../controllers/intakeController');

router.post('/add-intake', intakeController.addIntake);
router.get('/:userId', intakeController.getIntake);

module.exports = router;
