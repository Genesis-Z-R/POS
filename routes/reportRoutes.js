const express = require('express');
const router = express.Router();
const { 
  getDailySalesReport, getInventoryReport, getTopProductsReport 
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/daily-sales', getDailySalesReport);
router.get('/inventory', getInventoryReport);
router.get('/top-products', getTopProductsReport);

module.exports = router;
