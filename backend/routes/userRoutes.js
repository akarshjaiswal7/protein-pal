const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/:id', userController.getUser);
router.put('/update', userController.updateUser);
router.delete('/:id', verifyToken, userController.deleteAccount);

module.exports = router;
