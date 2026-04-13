const express = require('express');
const router = express.Router();
const nutritionistController = require('../controllers/nutritionistController');
const foodController = require('../controllers/foodController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(requireRole(['Nutritionist']));

// Patient monitoring
router.get('/patients', nutritionistController.getPatients);

// Notes system
router.post('/notes', nutritionistController.createNote);
router.get('/notes', nutritionistController.getMyNotes);                    // All notes this nutritionist sent
router.get('/notes/user/:userId', nutritionistController.getNotesForUser);  // Notes for a specific user
router.delete('/notes/:noteId', nutritionistController.deleteNote);

// Food management
router.get('/foods', foodController.getFoods);
router.post('/foods', foodController.addFood);
router.delete('/foods/:id', foodController.deleteFood);

module.exports = router;
