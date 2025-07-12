const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authenticateToken = require('../middlewares/auth');

// Passenger routes
router.get('/search', bookingController.searchBuses);
router.post('/book', authenticateToken, bookingController.bookBus);
router.get('/history', authenticateToken, bookingController.getBookingHistory);
router.post('/cancel/:bookingId', authenticateToken, bookingController.cancelBooking);

module.exports = router;