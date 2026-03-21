const express = require('express');
const router = express.Router();
const { searchCustomers, createCustomer } = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin', 'manager', 'cashier'), createCustomer);
router.get('/search', protect, authorize('admin', 'manager', 'cashier'), searchCustomers);

module.exports = router;
