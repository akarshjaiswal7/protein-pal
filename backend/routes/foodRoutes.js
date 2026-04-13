const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');

router.get('/', foodController.getFoods);
router.post('/add-food', foodController.addFood);

module.exports = router;
