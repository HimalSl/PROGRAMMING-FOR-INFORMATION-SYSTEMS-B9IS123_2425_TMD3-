const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middlewares/auth');
const requireAdmin = require('../middlewares/admin');

// Admin dashboard route
router.get('/dashboard', authenticateToken, requireAdmin, adminController.getDashboard);

// Approve driver route
router.post('/approve-driver/:driverId', authenticateToken, requireAdmin, adminController.approveDriver);

// Reject driver route
router.post('/reject-driver/:driverId', authenticateToken, requireAdmin, adminController.rejectDriver);

module.exports = router;