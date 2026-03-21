const express = require('express');
const router = express.Router();
const { getInventory, updateInventory, getLowStockAlerts } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/low-stock', protect, authorize('admin', 'manager'), getLowStockAlerts);
router.get('/', protect, authorize('admin', 'manager'), getInventory);
router.put('/:id', protect, authorize('admin', 'manager'), updateInventory);

module.exports = router;
