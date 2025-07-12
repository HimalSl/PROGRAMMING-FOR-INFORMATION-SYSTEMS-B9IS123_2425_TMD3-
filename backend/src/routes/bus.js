const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const authenticateToken = require('../middlewares/auth');

// Driver routes
router.post('/add', authenticateToken, busController.addBus);
router.put('/update/:busId', authenticateToken, busController.updateBus);
router.delete('/delete/:busId', authenticateToken, busController.deleteBus);
router.get('/locations', busController.getLocations);
router.get('/driver-buses', authenticateToken, busController.getDriverBuses);
router.get('/driver-bookings', authenticateToken, busController.getDriverBookingHistory);

module.exports = router;