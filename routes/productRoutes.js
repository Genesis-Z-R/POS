const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('admin', 'manager', 'cashier'), getProducts);
router.post('/', protect, authorize('admin', 'manager'), createProduct);
router.put('/:id', protect, authorize('admin', 'manager'), updateProduct);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteProduct);

module.exports = router;
