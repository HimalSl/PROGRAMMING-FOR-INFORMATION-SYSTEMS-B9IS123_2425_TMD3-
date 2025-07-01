const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/auth');

// Get user profile route
router.get('/profile', authenticateToken, userController.getProfile);

module.exports = router;