const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middlewares/auth');
const requireAdmin = require('../middlewares/admin');

// Admin dashboard
router.get('/dashboard', authenticateToken, requireAdmin, adminController.getDashboard);

// Approve/reject driver
router.post('/approve-driver/:driverId', authenticateToken, requireAdmin, adminController.approveDriver);
router.post('/reject-driver/:driverId', authenticateToken, requireAdmin, adminController.rejectDriver);

// Approve/reject bus
router.post('/approve-bus/:busId', authenticateToken, requireAdmin, adminController.approveBus);
router.post('/reject-bus/:busId', authenticateToken, requireAdmin, adminController.rejectBus);

// Location management
router.post('/locations/add', authenticateToken, requireAdmin, adminController.addLocation);
router.get('/locations', authenticateToken, requireAdmin, adminController.getLocations);
router.delete('/locations/:locationId', authenticateToken, requireAdmin, adminController.deleteLocation);

// Analytics
router.get('/analytics', authenticateToken, requireAdmin, adminController.getAnalytics);

module.exports = router;