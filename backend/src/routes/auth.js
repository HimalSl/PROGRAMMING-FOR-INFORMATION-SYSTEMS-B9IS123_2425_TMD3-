const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register new user
router.post('/register', authController.register);

// Email verification
router.get('/verify-email', authController.verifyEmail);

// Login
router.post('/login', authController.login);

// Create admin
router.post('/setup/create-admin', authController.createAdmin);

module.exports = router;