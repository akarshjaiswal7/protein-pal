const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', notesController.getUserNotes);

module.exports = router;
