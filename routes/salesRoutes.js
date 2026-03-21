const express = require('express');
const router = express.Router();
const { processSale, getSales } = require('../controllers/salesController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin', 'manager', 'cashier'), processSale);
router.get('/', protect, authorize('admin', 'manager'), getSales);

module.exports = router;
