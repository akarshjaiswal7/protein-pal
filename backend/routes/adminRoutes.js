const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const foodController = require('../controllers/foodController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(requireRole(['Admin']));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);

// Food moderation - Admin can also delete food
router.get('/foods', foodController.getFoods);
router.delete('/foods/:id', adminController.deleteFood);

module.exports = router;
