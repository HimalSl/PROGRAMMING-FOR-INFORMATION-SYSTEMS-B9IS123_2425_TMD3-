const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register new user route
router.post('/register', authController.register);

// Email verification route
router.get('/verify-email', authController.verifyEmail);

// Login route
router.post('/login', authController.login);

// Create admin route
router.post('/setup/create-admin', authController.createAdmin);

module.exports = router;