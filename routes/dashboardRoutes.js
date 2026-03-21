const express = require('express');
const router = express.Router();
const { 
  getDashboardSummary, getSalesTrend, getTopProducts, getPaymentMethods 
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/summary', getDashboardSummary);
router.get('/sales-trend', getSalesTrend);
router.get('/top-products', getTopProducts);
router.get('/payment-methods', getPaymentMethods);

module.exports = router;
