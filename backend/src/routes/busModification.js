const express = require('express');
const router = express.Router();
const busModificationController = require('../controllers/busModificationController');
const authenticateToken = require('../middlewares/auth');
const requireAdmin = require('../middlewares/admin');

// Async handler wrapper to catch errors and handle Promises
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/request', authenticateToken, asyncHandler(busModificationController.requestBusModification));
router.get('/', authenticateToken, requireAdmin, asyncHandler(busModificationController.getBusModifications));
router.post('/approve/:id', authenticateToken, requireAdmin, asyncHandler(busModificationController.approveBusModification));
router.post('/reject/:id', authenticateToken, requireAdmin, asyncHandler(busModificationController.rejectBusModification));

module.exports = router;